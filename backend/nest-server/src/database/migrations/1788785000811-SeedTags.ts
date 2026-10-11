import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedTags1788785000811 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO tags (
                name, label, description, facet, is_system) 
            VALUES
                ('work',      'tag.label.work',            	'Employment, career, employer',              			'domain', true),
                ('education', 'tag.label.education',       	'Schooling, studies, courses, training',     			'domain', true),
                ('health',    'tag.label.health',          	'Medicine, doctors, therapy, medication',    			'domain', true),
                ('insurance', 'tag.label.insurance',       	'Any kind of insurance, combine with the affected area','domain', true),
                ('finance',   'tag.label.finance',         	'Banking, taxes, retirement, investments',   			'domain', true),
                ('housing',   'tag.label.housing',         	'Rent, property, utilities, household',      			'domain', true),
                ('vehicles',  'tag.label.vehicles',        	'Cars, motorcycles, bicycles and accessories', 			'domain', true),
                ('travel',    'tag.label.travel',          	'Trips, bookings, stays abroad',             			'domain', true),
                ('leisure',   'tag.label.leisure',         	'Events, hobbies, memberships',              			'domain', true),
                ('shopping',  'tag.label.shopping',        	'Consumer purchases, orders, electronics, furniture',	'domain', true),
                ('family',    'tag.label.family',	   		'Civil status, ID documents, children, relatives', 		'domain', true),
                ('legal',     'tag.label.legal',       		'Government offices, notices, lawyers, disputes', 		'domain', true),
                ('pets',      'tag.label.pets',            	'Veterinarian, ownership, registration',     			'domain', true),
                ('other',     'tag.label.other',           	'Only if no other domain fits',              			'domain', true)
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
                ('banking',      'tag.label.banking',   	   'Checking account, credit card, payments', 		'finance'),
                ('taxes',        'tag.label.taxes',             'Tax return, notices, tax office',         		'finance'),
                ('retirement',   'tag.label.retirement',        'Pension, retirement provisions',          		'finance'),
                ('investments',  'tag.label.investments',       'Securities, funds, brokerage account',    		'finance'),
                ('loans',        'tag.label.loans',             'Loans, financing, leasing',               		'finance'),
                ('utilities',    'tag.label.utilities',         'Electricity, gas, water, heating, waste', 		'housing'),
                ('telecom',      'tag.label.telecom',  			'Mobile, landline, internet connection',   		'housing'),
                ('rental',       'tag.label.rental',         	'Rented apartment, landlord, utility costs',		'housing'),
                ('property',     'tag.label.property',			'Ownership, property management, property tax',	'housing'),
                ('identity',     'tag.label.identity',     		'ID card, passport, driver''s license',    		'family')
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
            INSERT INTO tags (name, label, description, facet, is_system) 
            VALUES
                ('contract',      'tag.label.contract',         'Contracts, policies, agreements, terminations', 					'doctype', true),
                ('invoice',       'tag.label.invoice',  		'Invoices, receipts, bills, reminders',          					'doctype', true),
                ('statement',     'tag.label.statement',        'Bank statements, payslips, annual statements',  					'doctype', true),
                ('notice',        'tag.label.notice',    		'Official notices, letters, notifications',      					'doctype', true),
                ('certificate',   'tag.label.certificate',      'Diplomas, certificates, vaccination record, inspection, deeds',	'doctype', true),
                ('report',        'tag.label.report',           'Medical findings, expert reports, minutes',     					'doctype', true),
                ('ticket',        'tag.label.ticket',   		'Booking confirmations, admission tickets, invitations', 			'doctype', true),
                ('application',   'tag.label.application',      'Applications, job applications, resume',        					'doctype', true),
                ('id-document',   'tag.label.id-document',      'Official identity documents',                   					'doctype', true),
                ('manual',        'tag.label.manual',  			'User manuals, warranty cards, data sheets',      					'doctype', true),
                ('correspondence','tag.label.correspondence',	'Other correspondence with no clear form',							'doctype', true)
            ON CONFLICT (name) DO UPDATE
            SET label = EXCLUDED.label,
            description = EXCLUDED.description, 
            facet = EXCLUDED.facet,
            is_system = EXCLUDED.is_system
            `);
        
    }
    

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM tags
            WHERE name IN ( 
                'banking',
                'taxes',
                'retirement',
                'investments',
                'loans',
                'utilities',
                'telecom',
                'rental',
                'property',
                'identity'
            )
            `);

        await queryRunner.query(`
            DELETE FROM tags
            WHERE name IN (
                'work',
                'education',
                'health',
                'insurance',
                'finance',
                'housing',
                'vehicles',
                'travel',
                'leisure',
                'shopping',
                'family',
                'legal',
                'pets',
                'other',
                'contract',
                'invoice',
                'statement',
                'notice',
                'certificate',
                'report',
                'ticket',
                'application',
                'id-document',
                'manual',
                'correspondence'
            )
            `);
    }

}
