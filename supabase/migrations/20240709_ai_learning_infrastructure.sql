-- AI Learning Infrastructure Migration for STR Certified
-- Adds vector storage, knowledge base, and learning system tables

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create custom types for AI learning system
DO $$ BEGIN
    CREATE TYPE knowledge_category AS ENUM (
        'building_codes',
        'safety_regulations', 
        'ada_compliance',
        'fire_safety',
        'electrical_standards',
        'plumbing_codes',
        'hvac_requirements',
        'structural_integrity',
        'environmental_health',
        'best_practices',
        'local_ordinances'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_category AS ENUM (
        'photo_quality',
        'object_detection',
        'room_classification',
        'damage_assessment',
        'completeness_check',
        'safety_compliance',
        'amenity_verification',
        'measurement_accuracy',
        'condition_rating'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_type AS ENUM (
        'correction',
        'validation',
        'suggestion',
        'issue'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===================================================================
-- PHASE 1: KNOWLEDGE BASE AND VECTOR STORAGE
-- ===================================================================

-- Knowledge base for RAG/CAG system
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category knowledge_category NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    
    -- Vector embeddings for semantic search (OpenAI ada-002 dimension)
    embedding vector(1536) NOT NULL,
    
    -- Metadata for context filtering and search
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Usage tracking for relevance optimization
    query_count INTEGER DEFAULT 0,
    relevance_score DECIMAL(3,2) DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    citation_count INTEGER DEFAULT 0,
    
    -- Lifecycle management
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'draft')),
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    expiration_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector index for fast similarity search using cosine distance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding 
ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Standard indexes for filtering and search
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status ON knowledge_base(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_metadata ON knowledge_base USING gin(metadata);

-- ===================================================================
-- PHASE 2: AI LEARNING AND FEEDBACK SYSTEM
-- ===================================================================

-- Structured auditor feedback for continuous AI learning
CREATE TABLE IF NOT EXISTS auditor_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    auditor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    checklist_item_id UUID, -- May reference dynamic items not in static table
    
    -- AI prediction vs auditor correction (JSONB for flexibility)
    ai_prediction JSONB NOT NULL,
    auditor_correction JSONB NOT NULL,
    
    -- Categorization and typing
    feedback_type feedback_type NOT NULL,
    category feedback_category NOT NULL,
    
    -- Learning impact metrics
    confidence_impact DECIMAL(5,2), -- -100 to +100, impact on AI confidence
    accuracy_improvement DECIMAL(5,2), -- Measured improvement from this feedback
    
    -- Context preservation for pattern learning
    property_context JSONB DEFAULT '{}',
    inspector_context JSONB DEFAULT '{}',
    temporal_context JSONB DEFAULT '{}',
    
    -- Learning processing state
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 100),
    
    -- Pattern identification
    identified_patterns TEXT[],
    similar_cases UUID[], -- References to similar feedback instances
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for feedback analysis and retrieval
CREATE INDEX IF NOT EXISTS idx_auditor_feedback_inspection ON auditor_feedback(inspection_id);
CREATE INDEX IF NOT EXISTS idx_auditor_feedback_auditor ON auditor_feedback(auditor_id);
CREATE INDEX IF NOT EXISTS idx_auditor_feedback_category ON auditor_feedback(category);
CREATE INDEX IF NOT EXISTS idx_auditor_feedback_processed ON auditor_feedback(processed);
CREATE INDEX IF NOT EXISTS idx_auditor_feedback_created ON auditor_feedback(created_at);

-- AI model versions and performance tracking
CREATE TABLE IF NOT EXISTS ai_model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT UNIQUE NOT NULL,
    model_type TEXT NOT NULL, -- 'photo_analysis', 'checklist_generation', etc.
    parent_version TEXT REFERENCES ai_model_versions(version),
    
    -- Performance metrics
    accuracy_rate DECIMAL(5,2) CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100),
    confidence_calibration DECIMAL(5,2),
    processing_speed_ms INTEGER,
    false_positive_rate DECIMAL(5,2),
    false_negative_rate DECIMAL(5,2),
    
    -- Training and validation data
    training_feedback_count INTEGER DEFAULT 0,
    validation_feedback_count INTEGER DEFAULT 0,
    validation_results JSONB DEFAULT '{}',
    
    -- Model parameters and configuration
    model_parameters JSONB DEFAULT '{}',
    training_config JSONB DEFAULT '{}',
    
    -- Deployment information
    deployed_at TIMESTAMPTZ,
    deployment_trigger TEXT CHECK (deployment_trigger IN ('scheduled', 'threshold', 'manual')),
    deployment_notes TEXT,
    
    -- Lifecycle
    status TEXT DEFAULT 'training' CHECK (status IN ('training', 'testing', 'deployed', 'deprecated')),
    deprecated_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for model version tracking
CREATE INDEX IF NOT EXISTS idx_ai_model_versions_type ON ai_model_versions(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_model_versions_status ON ai_model_versions(status);
CREATE INDEX IF NOT EXISTS idx_ai_model_versions_deployed ON ai_model_versions(deployed_at);

-- Learning metrics aggregation table for performance dashboards
CREATE TABLE IF NOT EXISTS learning_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version TEXT REFERENCES ai_model_versions(version),
    metric_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    category feedback_category,
    
    -- Time period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Aggregated metrics
    total_feedback INTEGER DEFAULT 0,
    corrections_count INTEGER DEFAULT 0,
    validations_count INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2),
    confidence_improvement DECIMAL(5,2),
    
    -- Trend analysis
    trend_direction TEXT CHECK (trend_direction IN ('improving', 'declining', 'stable')),
    change_percent DECIMAL(5,2),
    
    -- Context analysis
    property_type_performance JSONB DEFAULT '{}',
    inspector_performance JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for metrics analysis
CREATE INDEX IF NOT EXISTS idx_learning_metrics_model ON learning_metrics(model_version);
CREATE INDEX IF NOT EXISTS idx_learning_metrics_period ON learning_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_learning_metrics_category ON learning_metrics(category);

-- ===================================================================
-- PHASE 3: CAG (CONTEXT AUGMENTED GENERATION) SYSTEM
-- ===================================================================

-- Context patterns for intelligent context selection
CREATE TABLE IF NOT EXISTS cag_context_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name TEXT NOT NULL,
    pattern_type TEXT NOT NULL, -- 'property_specific', 'seasonal', 'regulatory', 'inspector_specific'
    
    -- Pattern definition (flexible JSON structure)
    conditions JSONB NOT NULL, -- When this pattern applies
    context_data JSONB NOT NULL, -- What context to include
    weight DECIMAL(3,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
    
    -- Performance tracking
    usage_count INTEGER DEFAULT 0,
    accuracy_improvement DECIMAL(5,2),
    confidence_boost DECIMAL(5,2),
    
    -- Validation and lifecycle
    confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    last_validated TIMESTAMPTZ DEFAULT NOW(),
    validation_score DECIMAL(5,2),
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'testing', 'deprecated')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for pattern matching and retrieval
CREATE INDEX IF NOT EXISTS idx_cag_patterns_type ON cag_context_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_cag_patterns_status ON cag_context_patterns(status);
CREATE INDEX IF NOT EXISTS idx_cag_patterns_conditions ON cag_context_patterns USING gin(conditions);

-- RAG/CAG query logging for performance optimization
CREATE TABLE IF NOT EXISTS rag_query_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT NOT NULL,
    query_embedding vector(1536), -- Query embedding for similarity analysis
    query_type TEXT NOT NULL, -- 'checklist_generation', 'photo_analysis', etc.
    
    -- Context and retrieval
    retrieved_knowledge_ids UUID[],
    similarity_scores DECIMAL(3,2)[],
    selected_context JSONB DEFAULT '{}',
    context_selection_reason TEXT,
    
    -- CAG-specific context augmentation
    cag_patterns_applied UUID[],
    context_weight DECIMAL(3,2),
    dynamic_context JSONB DEFAULT '{}',
    
    -- Performance metrics
    query_time_ms INTEGER,
    context_retrieval_time_ms INTEGER,
    total_processing_time_ms INTEGER,
    
    -- Outcome tracking
    ai_prediction_accuracy DECIMAL(5,2),
    auditor_satisfaction_score INTEGER CHECK (auditor_satisfaction_score >= 1 AND auditor_satisfaction_score <= 5),
    context_relevance_score DECIMAL(3,2),
    
    -- Associated inspection data
    inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
    checklist_item_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for query analysis and optimization
CREATE INDEX IF NOT EXISTS idx_rag_query_log_type ON rag_query_log(query_type);
CREATE INDEX IF NOT EXISTS idx_rag_query_log_inspection ON rag_query_log(inspection_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_log_created ON rag_query_log(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_query_log_embedding ON rag_query_log USING ivfflat (query_embedding vector_cosine_ops) WITH (lists = 50);

-- ===================================================================
-- FUNCTIONS FOR SEMANTIC SEARCH AND LEARNING
-- ===================================================================

-- Function for semantic search in knowledge base
CREATE OR REPLACE FUNCTION search_knowledge_base(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.8,
    match_count int DEFAULT 5,
    filter_category knowledge_category DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    category knowledge_category,
    similarity FLOAT,
    source TEXT,
    metadata JSONB
)
LANGUAGE sql STABLE
AS $$
    SELECT 
        kb.id,
        kb.title,
        kb.content,
        kb.category,
        1 - (kb.embedding <=> query_embedding) AS similarity,
        kb.source,
        kb.metadata
    FROM knowledge_base kb
    WHERE 
        (filter_category IS NULL OR kb.category = filter_category)
        AND kb.status = 'active'
        AND 1 - (kb.embedding <=> query_embedding) > match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Function to update knowledge base usage statistics
CREATE OR REPLACE FUNCTION update_knowledge_usage(
    knowledge_id UUID,
    relevance_feedback DECIMAL DEFAULT NULL
)
RETURNS void
LANGUAGE sql
AS $$
    UPDATE knowledge_base 
    SET 
        query_count = query_count + 1,
        relevance_score = CASE 
            WHEN relevance_feedback IS NOT NULL THEN 
                (relevance_score * query_count + relevance_feedback) / (query_count + 1)
            ELSE relevance_score
        END,
        updated_at = NOW()
    WHERE id = knowledge_id;
$$;

-- Function to calculate learning metrics
CREATE OR REPLACE FUNCTION calculate_learning_metrics(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    model_version_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    category feedback_category,
    total_feedback BIGINT,
    accuracy_rate DECIMAL,
    improvement_rate DECIMAL
)
LANGUAGE sql STABLE
AS $$
    SELECT 
        af.category,
        COUNT(*) as total_feedback,
        AVG(CASE 
            WHEN (af.ai_prediction->>'value') = (af.auditor_correction->>'value') 
            THEN 100.0 
            ELSE 0.0 
        END) as accuracy_rate,
        AVG(af.accuracy_improvement) as improvement_rate
    FROM auditor_feedback af
    WHERE 
        af.created_at BETWEEN start_date AND end_date
        AND af.processed = true
        AND (model_version_filter IS NULL OR af.ai_prediction->>'modelVersion' = model_version_filter)
    GROUP BY af.category
    ORDER BY accuracy_rate DESC;
$$;

-- ===================================================================
-- TRIGGERS FOR AUTOMATED MAINTENANCE
-- ===================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auditor_feedback_updated_at BEFORE UPDATE ON auditor_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_model_versions_updated_at BEFORE UPDATE ON ai_model_versions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_metrics_updated_at BEFORE UPDATE ON learning_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cag_context_patterns_updated_at BEFORE UPDATE ON cag_context_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ===================================================================

-- Enable RLS on all AI learning tables
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cag_context_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_query_log ENABLE ROW LEVEL SECURITY;

-- Knowledge base policies (read-only for authenticated users)
CREATE POLICY "Knowledge base is readable by authenticated users" ON knowledge_base
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Knowledge base is writable by admins" ON knowledge_base
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'system'
    );

-- Auditor feedback policies
CREATE POLICY "Auditor feedback is readable by auditors and admins" ON auditor_feedback
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'auditor' OR 
        auth.jwt() ->> 'role' = 'admin' OR
        auditor_id = auth.uid()
    );

CREATE POLICY "Auditor feedback is writable by auditors" ON auditor_feedback
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'auditor' OR 
        auth.jwt() ->> 'role' = 'admin'
    );

-- AI model versions (admin access only)
CREATE POLICY "AI model versions are readable by authenticated users" ON ai_model_versions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "AI model versions are writable by admins" ON ai_model_versions
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'system'
    );

-- ===================================================================
-- INITIAL DATA SETUP
-- ===================================================================

-- Insert initial AI model version
INSERT INTO ai_model_versions (version, model_type, status, accuracy_rate) 
VALUES 
    ('v1.0.0', 'photo_analysis', 'deployed', 75.0),
    ('v1.0.0', 'checklist_generation', 'deployed', 82.0),
    ('v1.0.0', 'completeness_validation', 'deployed', 78.0)
ON CONFLICT (version) DO NOTHING;

-- Insert sample knowledge base entries for building codes
INSERT INTO knowledge_base (category, title, content, source, embedding, metadata) VALUES 
    (
        'safety_regulations',
        'Smoke Detector Requirements',
        'Smoke detectors must be installed in every bedroom, outside each sleeping area, and on every level of the home including basements. Detectors should be tested monthly and batteries replaced annually.',
        'International Fire Code 2021',
        array_fill(0.001, ARRAY[1536])::vector, -- Placeholder embedding
        '{"jurisdiction": "international", "code_section": "907.2.11", "last_updated": "2021-01-01"}'::jsonb
    ),
    (
        'building_codes',
        'Emergency Egress Requirements',
        'Every sleeping room must have at least one operable emergency escape and rescue opening. The opening must open directly to the outside or to a court that opens to a public street.',
        'International Residential Code 2021',
        array_fill(0.001, ARRAY[1536])::vector, -- Placeholder embedding
        '{"jurisdiction": "international", "code_section": "R310", "applies_to": ["bedrooms", "basements"]}'::jsonb
    )
ON CONFLICT DO NOTHING;

-- Create initial CAG context patterns
INSERT INTO cag_context_patterns (pattern_name, pattern_type, conditions, context_data, weight) VALUES
    (
        'high_end_property_inspection',
        'property_specific',
        '{"property_value": {"min": 500000}, "amenities": {"includes": ["pool", "hot_tub", "fireplace"]}}'::jsonb,
        '{"focus_areas": ["luxury_amenities", "high_end_finishes", "premium_safety_features"], "quality_threshold": 90}'::jsonb,
        0.9
    ),
    (
        'winter_season_adjustments',
        'seasonal',
        '{"month": {"in": [11, 12, 1, 2, 3]}, "location": {"climate": "cold"}}'::jsonb,
        '{"additional_checks": ["heating_system", "insulation", "ice_dam_prevention"], "seasonal_priorities": ["heating", "ventilation"]}'::jsonb,
        0.8
    )
ON CONFLICT DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE knowledge_base IS 'Stores external knowledge for RAG/CAG system including building codes, regulations, and best practices';
COMMENT ON TABLE auditor_feedback IS 'Captures structured feedback from auditors for AI model improvement and learning';
COMMENT ON TABLE ai_model_versions IS 'Tracks different versions of AI models with performance metrics and deployment history';
COMMENT ON TABLE cag_context_patterns IS 'Defines intelligent context selection patterns for Context Augmented Generation';
COMMENT ON TABLE rag_query_log IS 'Logs all RAG/CAG queries for performance analysis and optimization';

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;