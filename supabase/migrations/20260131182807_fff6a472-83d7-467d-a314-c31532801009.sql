-- Create payment_transactions table for tracking all payment activities
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  transaction_type TEXT NOT NULL, -- 'payment', 'refund', 'cancellation'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_method TEXT, -- 'card', 'upi', 'netbanking', etc.
  reference_id TEXT, -- external payment gateway reference
  notes TEXT,
  processed_by UUID, -- admin who processed refund/cancellation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all transactions"
ON public.payment_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Companies can view their transactions"
ON public.payment_transactions
FOR SELECT
USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Students can view their transactions"
ON public.payment_transactions
FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();