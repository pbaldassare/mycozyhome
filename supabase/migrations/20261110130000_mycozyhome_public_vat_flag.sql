-- Specifiche §3 (TU 6.3): prima della conferma il cliente vede se il professionista ha la P.IVA o è privato.
-- Solo il flag: il numero di P.IVA resta riservato.
GRANT SELECT (has_vat_number) ON mycozyhome.professionals TO anon, authenticated;
