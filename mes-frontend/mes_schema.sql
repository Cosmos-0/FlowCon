-- MES Database Schema (PostgreSQL)

-- 1. USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    role VARCHAR(20) NOT NULL DEFAULT 'User',
    joined TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP
);

-- 2. PRODUCTION LINES
CREATE TABLE production_lines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    alarms INTEGER DEFAULT 0,
    last_production DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. MACHINES
CREATE TABLE machines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_maintenance DATE,
    next_maintenance DATE,
    production_line_id INTEGER REFERENCES production_lines(id),
    work_order_id INTEGER REFERENCES work_orders(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    counter_type VARCHAR(20) DEFAULT 'status'
);

-- 4. SHIFTS
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    assigned_line_id INTEGER REFERENCES production_lines(id),
    assigned_operator_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. WORK ORDERS
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    product VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    due_date DATE,
    assigned_line_id INTEGER REFERENCES production_lines(id),
    progress NUMERIC(3,2) DEFAULT 0,
    alarms INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. STOPS
CREATE TABLE stops (
    id SERIAL PRIMARY KEY,
    machine_id INTEGER REFERENCES machines(id),
    line_id INTEGER REFERENCES production_lines(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    reason VARCHAR(255),
    resolved BOOLEAN DEFAULT FALSE,
    recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. ALARMS
CREATE TABLE alarms (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- 8. EVENTS
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
); 