import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedTags1788785000811 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO tags (
                name, label, description, facet, is_system) 
            VALUES
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
            ON CONFLICT (name) do Update
            SET
                label = EXCLUDED.label,
                description = EXCLUDED.description, 
                facet = EXCLUDED.facet,
                is_system = EXCLUDED.is_system
            `);
        
        await queryRunner.query(`
            INSERT INTO tags (name, label, description, facet, is_system, parent_id)
            SELECT  v.name, v.label, v.description, 'domain', true, p.id
            FROM (
                VALUES
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
            SET 
                label =  EXCLUDED.label,
                description = EXCLUDED.description, 
                parent_id = EXCLUDED.parent_id,
                facet = EXCLUDED.facet,
                is_system = EXCLUDED.is_system
            `);
        
        await queryRunner.query(`
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
            SET label = EXCLUDED.label,
            description = EXCLUDED.description, 
            facet = EXCLUDED.facet;
            is_system = EXCLUDED.is_system
            `)
        
    }
    

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
