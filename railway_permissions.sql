-- Insert Permissions
INSERT IGNORE INTO permission (id, name, created_at, created_by, deleted) VALUES
(1, 'user.view.all', NOW(), 'SYSTEM', false),
(2, 'user.manage.all', NOW(), 'SYSTEM', false),
(3, 'user.manage.own', NOW(), 'SYSTEM', false),
(4, 'role.view.all', NOW(), 'SYSTEM', false),
(5, 'role.manage.all', NOW(), 'SYSTEM', false),
(6, 'event.view.all', NOW(), 'SYSTEM', false),
(7, 'event.manage.all', NOW(), 'SYSTEM', false),
(8, 'event.manage.own', NOW(), 'SYSTEM', false);

-- Assign all permissions to SuperAdmin role (id=1)
INSERT IGNORE INTO role_permission (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8);

-- Assign limited permissions to Admin role (id=2) 
INSERT IGNORE INTO role_permission (role_id, permission_id) VALUES
(2, 1), (2, 3), (2, 4), (2, 6), (2, 8);

-- Assign basic permissions to Attendee role (id=3)
INSERT IGNORE INTO role_permission (role_id, permission_id) VALUES
(3, 3), (3, 8);
