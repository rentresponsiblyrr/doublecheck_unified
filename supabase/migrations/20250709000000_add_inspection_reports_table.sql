-- Add inspection_reports table for storing report metadata
CREATE TABLE IF NOT EXISTS public.inspection_reports (
    id TEXT PRIMARY KEY,
    inspection_id UUID NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version TEXT NOT NULL DEFAULT '1.0.0',
    options JSONB DEFAULT '{}',
    file_size BIGINT DEFAULT 0,
    file_path TEXT,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_inspection_reports_inspection_id 
        FOREIGN KEY (inspection_id) 
        REFERENCES public.inspections(id) 
        ON DELETE CASCADE
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_inspection_reports_inspection_id 
    ON public.inspection_reports(inspection_id);

CREATE INDEX IF NOT EXISTS idx_inspection_reports_generated_at 
    ON public.inspection_reports(generated_at);

-- Add RLS policies
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own reports
CREATE POLICY "Users can view their own inspection reports"
    ON public.inspection_reports FOR SELECT
    TO authenticated
    USING (
        inspection_id IN (
            SELECT id FROM public.inspections 
            WHERE inspector_id = auth.uid()
        )
    );

-- Allow authenticated users to create reports
CREATE POLICY "Users can create inspection reports"
    ON public.inspection_reports FOR INSERT
    TO authenticated
    WITH CHECK (
        inspection_id IN (
            SELECT id FROM public.inspections 
            WHERE inspector_id = auth.uid()
        )
    );

-- Allow authenticated users to update their own reports
CREATE POLICY "Users can update their own inspection reports"
    ON public.inspection_reports FOR UPDATE
    TO authenticated
    USING (
        inspection_id IN (
            SELECT id FROM public.inspections 
            WHERE inspector_id = auth.uid()
        )
    );

-- Add audit_feedback table if it doesn't exist (for AI learning)
CREATE TABLE IF NOT EXISTS public.audit_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL,
    auditor_decision TEXT NOT NULL CHECK (auditor_decision IN ('approved', 'rejected', 'needs_revision')),
    feedback_text TEXT,
    review_time_minutes INTEGER,
    overrides_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_audit_feedback_inspection_id 
        FOREIGN KEY (inspection_id) 
        REFERENCES public.inspections(id) 
        ON DELETE CASCADE
);

-- Add index for audit feedback
CREATE INDEX IF NOT EXISTS idx_audit_feedback_inspection_id 
    ON public.audit_feedback(inspection_id);

CREATE INDEX IF NOT EXISTS idx_audit_feedback_created_at 
    ON public.audit_feedback(created_at);

-- Add RLS policies for audit feedback
ALTER TABLE public.audit_feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view audit feedback
CREATE POLICY "Users can view audit feedback"
    ON public.audit_feedback FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to create audit feedback
CREATE POLICY "Users can create audit feedback"
    ON public.audit_feedback FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Add updated_at trigger for inspection_reports
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inspection_reports_updated_at
    BEFORE UPDATE ON public.inspection_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_feedback_updated_at
    BEFORE UPDATE ON public.audit_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add report_deliveries table for tracking report distribution
CREATE TABLE IF NOT EXISTS public.report_deliveries (
    id TEXT PRIMARY KEY,
    inspection_id UUID NOT NULL,
    report_id TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'portal', 'manual')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_report_deliveries_inspection_id 
        FOREIGN KEY (inspection_id) 
        REFERENCES public.inspections(id) 
        ON DELETE CASCADE
);

-- Add indexes for report deliveries
CREATE INDEX IF NOT EXISTS idx_report_deliveries_inspection_id 
    ON public.report_deliveries(inspection_id);

CREATE INDEX IF NOT EXISTS idx_report_deliveries_status 
    ON public.report_deliveries(status);

CREATE INDEX IF NOT EXISTS idx_report_deliveries_sent_at 
    ON public.report_deliveries(sent_at);

-- Add RLS policies for report deliveries
ALTER TABLE public.report_deliveries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view delivery records
CREATE POLICY "Users can view report deliveries"
    ON public.report_deliveries FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to create delivery records
CREATE POLICY "Users can create report deliveries"
    ON public.report_deliveries FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update delivery records
CREATE POLICY "Users can update report deliveries"
    ON public.report_deliveries FOR UPDATE
    TO authenticated
    USING (true);

-- Add updated_at trigger for report deliveries
CREATE TRIGGER update_report_deliveries_updated_at
    BEFORE UPDATE ON public.report_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();