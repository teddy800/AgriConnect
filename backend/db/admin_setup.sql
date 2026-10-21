-- AgriConnect Admin User Setup Script
-- This script creates/updates the admin user with proper credentials
-- Password: password123 (change in production!)

-- First, check if admin user exists
DO $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM users WHERE phone='0911111111') INTO admin_exists;
    
    IF admin_exists THEN
        -- Update existing admin user
        UPDATE users 
        SET 
            password_hash = '$2a$10$E3ChMc1k8FDBlxw9OoObLOw2aOrzfkVjM7LLJEiyGzAh7Q8KixAQi',
            email = 'admin@agriconnect.com',
            full_name = 'Admin User',
            role = 'admin',
            is_verified = TRUE,
            is_active = TRUE,
            updated_at = NOW()
        WHERE phone = '0911111111';
        
        RAISE NOTICE 'Admin user updated successfully!';
    ELSE
        -- Create new admin user
        INSERT INTO users (
            phone, 
            email,
            password_hash, 
            full_name, 
            role, 
            region_id, 
            preferred_lang, 
            is_verified, 
            is_active
        ) VALUES (
            '0911111111',
            'admin@agriconnect.com',
            '$2a$10$E3ChMc1k8FDBlxw9OoObLOw2aOrzfkVjM7LLJEiyGzAh7Q8KixAQi',
            'Admin User',
            'admin',
            (SELECT id FROM regions WHERE name='Addis Ababa' LIMIT 1),
            'en',
            TRUE,
            TRUE
        );
        
        RAISE NOTICE 'Admin user created successfully!';
    END IF;
END $$;

-- Display admin user details
SELECT 
    id,
    phone,
    email,
    full_name,
    role,
    is_verified,
    is_active,
    created_at
FROM users 
WHERE phone = '0911111111';

-- Summary
SELECT 
    '✅ Admin Setup Complete!' as status,
    'Phone: 0911111111' as phone_login,
    'Email: admin@agriconnect.com' as email_login,
    'Password: password123' as password,
    'WARNING: Change password in production!' as security_note;
