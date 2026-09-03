CREATE TABLE IF NOT EXISTS ai_documents (
	id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
	status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'FINISHED', 'FAILED')),
	ai_summary TEXT,
	language VARCHAR(10),
	error_key TEXT,
	error_detail TEXT,
	retry_count SMALLINT NOT NULL DEFAULT 0,
	processed_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_chunks (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	ai_document_id UUID NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
	chunk_index INTEGER NOT NULL,
	content TEXT NOT NULL,
	embedding VECTOR(1024) NOT NULL,
	token_count INTEGER NOT NULL,
	page_number INTEGER,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE (ai_document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS ai_chunks_ai_document_id_idx ON ai_chunks (ai_document_id);
CREATE INDEX IF NOT EXISTS ai_chunks_embedding_hnsw_idx ON ai_chunks USING hnsw (embedding vector_cosine_ops);

-- wird verschoben in nest server als tabelle "tags" - ehemals ai_tags
CREATE TABLE IF NOT EXISTS tags (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name VARCHAR(100) NOT NULL UNIQUE,
	label VARCHAR(150) NOT NULL,
	description VARCHAR(500),
	facet VARCHAR(16) NOT NULL DEFAULT 'domain' CHECK (facet IN ('domain', 'doctype')),
	parent_id UUID REFERENCES tags(id) ON DELETE SET NULL,
	is_system BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT no_self_parent CHECK (parent_id IS DISTINCT FROM id)
);

CREATE TABLE IF NOT EXISTS ai_document_tags (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	ai_document_id UUID NOT NULL REFERENCES ai_documents(id) ON DELETE CASCADE,
	ai_tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
	proposed_name VARCHAR(100),
	proposed_label VARCHAR(150),
	proposed_facet VARCHAR(16) CHECK (proposed_facet IN ('domain', 'doctype')),
	proposed_parent_id UUID REFERENCES tags(id) ON DELETE SET NULL,
	confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT ai_document_tags_tag_exists_or_proposal CHECK (
		(ai_tag_id IS NOT NULL AND proposed_name IS NULL)
		OR (ai_tag_id IS NULL AND proposed_name IS NOT NULL)
	)
);
CREATE UNIQUE INDEX IF NOT EXISTS ai_document_tags_unique_tag ON ai_document_tags (ai_document_id, COALESCE(ai_tag_id::text, proposed_name));

CREATE INDEX IF NOT EXISTS ai_document_tags_idx ON ai_document_tags (ai_document_id);

INSERT INTO tags (name, label, description, facet, is_system) VALUES
	('work',      'Work',            	'Employment, career, employer',              			'domain', true),
	('education', 'Education',       	'Schooling, studies, courses, training',     			'domain', true),
	('health',    'Health',          	'Medicine, doctors, therapy, medication',    			'domain', true),
	('insurance', 'Insurance',       	'Any kind of insurance, combine with the affected area','domain', true),
	('finance',   'Finance',         	'Banking, taxes, retirement, investments',   			'domain', true),
	('housing',   'Housing',         	'Rent, property, utilities, household',      			'domain', true),
	('vehicles',  'Vehicles',        	'Cars, motorcycles, bicycles and accessories', 			'domain', true),
	('travel',    'Travel',          	'Trips, bookings, stays abroad',             			'domain', true),
	('leisure',   'Leisure',         	'Events, hobbies, memberships',              			'domain', true),
	('shopping',  'Shopping',        	'Consumer purchases, orders, electronics, furniture',	'domain', true),
	('family',    'Family & Personal',	'Civil status, ID documents, children, relatives', 		'domain', true),
	('legal',     'Legal & Authorities','Government offices, notices, lawyers, disputes', 		'domain', true),
	('pets',      'Pets',            	'Veterinarian, ownership, registration',     			'domain', true),
	('other',     'Other',           	'Only if no other domain fits',              			'domain', true)
ON CONFLICT (name) DO UPDATE
SET label = EXCLUDED.label, description = EXCLUDED.description, facet = EXCLUDED.facet;

INSERT INTO tags (name, label, description, facet, is_system, parent_id)
SELECT v.name, v.label, v.description, 'domain', true, p.id
FROM (VALUES
	('banking',      'Bank Account',      'Checking account, credit card, payments', 		'finance'),
	('taxes',        'Taxes',             'Tax return, notices, tax office',         		'finance'),
	('retirement',   'Retirement',        'Pension, retirement provisions',          		'finance'),
	('investments',  'Investments',       'Securities, funds, brokerage account',    		'finance'),
	('loans',        'Loans',             'Loans, financing, leasing',               		'finance'),
	('utilities',    'Utilities',         'Electricity, gas, water, heating, waste', 		'housing'),
	('telecom',      'Phone & Internet',  'Mobile, landline, internet connection',   		'housing'),
	('rental',       'Tenancy',           'Rented apartment, landlord, utility costs',		'housing'),
	('property',     'Property Ownership','Ownership, property management, property tax',	'housing'),
	('identity',     'ID Documents',      'ID card, passport, driver''s license',    		'family')
) AS v(name, label, description, parent_name)
JOIN tags p ON p.name = v.parent_name
ON CONFLICT (name) DO UPDATE
SET label = EXCLUDED.label, description = EXCLUDED.description, parent_id = EXCLUDED.parent_id, facet = EXCLUDED.facet;

INSERT INTO tags (name, label, description, facet, is_system) VALUES
	('contract',      'Contract',           'Contracts, policies, agreements, terminations', 					'doctype', true),
	('invoice',       'Invoice & Receipt',  'Invoices, receipts, bills, reminders',          					'doctype', true),
	('statement',     'Statement',          'Bank statements, payslips, annual statements',  					'doctype', true),
	('notice',        'Notice & Letter',    'Official notices, letters, notifications',      					'doctype', true),
	('certificate',   'Certificate',        'Diplomas, certificates, vaccination record, inspection, deeds',	'doctype', true),
	('report',        'Report',             'Medical findings, expert reports, minutes',     					'doctype', true),
	('ticket',        'Ticket & Booking',   'Booking confirmations, admission tickets, invitations', 			'doctype', true),
	('application',   'Application',        'Applications, job applications, resume',        					'doctype', true),
	('id-document',   'ID Document',        'Official identity documents',                   					'doctype', true),
	('manual',        'Manual & Warranty',  'User manuals, warranty cards, data sheets',      					'doctype', true),
	('correspondence','Correspondence',     'Other correspondence with no clear form',							'doctype', true)
ON CONFLICT (name) DO UPDATE
SET label = EXCLUDED.label, description = EXCLUDED.description, facet = EXCLUDED.facet;
