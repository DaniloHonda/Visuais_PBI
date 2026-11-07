-- =====================================================================
-- TRB 02 - Script 04: views usadas pelos dashboards (Power BI e Python)
-- Os dashboards leem estas views, que por sua vez leem as tabelas criadas.
-- =====================================================================

-- Base detalhada: uma linha por candidatura, com dados das 4 tabelas
CREATE OR REPLACE VIEW vw_candidaturas AS
SELECT C.id_candidatura, C.data_candidatura,
       DATE_TRUNC('month', C.data_candidatura)::date AS mes,
       C.etapa, C.situacao, C.pretensao_salarial,
       V.id_vaga, V.titulo AS vaga, V.area, V.senioridade, V.status AS status_vaga,
       R.nome AS recrutador,
       CA.nome AS candidato, CA.cidade, CA.origem
FROM candidatura C
INNER JOIN vaga V        ON (C.id_vaga = V.id_vaga)
INNER JOIN recrutador R  ON (V.id_recrutador = R.id_recrutador)
INNER JOIN candidato CA  ON (C.id_candidato = CA.id_candidato);

-- Consulta 2.1 (JOIN + GROUP BY + HAVING)
CREATE OR REPLACE VIEW vw_vagas_mais_15 AS
SELECT V.titulo, R.nome AS recrutador, COUNT(*) AS total_candidaturas
FROM candidatura C INNER JOIN vaga V ON (C.id_vaga = V.id_vaga)
INNER JOIN recrutador R ON (V.id_recrutador = R.id_recrutador)
GROUP BY V.titulo, R.nome
HAVING COUNT(*) > 15;

-- Consulta 3.1 (JOIN + sub select)
CREATE OR REPLACE VIEW vw_vagas_acima_media AS
SELECT V.titulo, R.nome AS recrutador, COUNT(*) AS total_candidaturas
FROM candidatura C INNER JOIN vaga V ON (C.id_vaga = V.id_vaga)
INNER JOIN recrutador R ON (V.id_recrutador = R.id_recrutador)
GROUP BY V.titulo, R.nome
HAVING COUNT(*) > (SELECT AVG(qtd)
                   FROM (SELECT COUNT(*) AS qtd FROM candidatura GROUP BY id_vaga) AS por_vaga);

SELECT * FROM vw_vagas_acima_media ORDER BY total_candidaturas DESC;
