
-- Fix search_path for new functions
ALTER FUNCTION calculate_interview_rating_average() SET search_path = public;
ALTER FUNCTION calculate_risk_score() SET search_path = public;
