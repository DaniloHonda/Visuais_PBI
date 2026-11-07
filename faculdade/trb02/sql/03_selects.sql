-- =====================================================================
-- TRB 02 - Script 03: consultas (SELECT)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Exibição dos dados de cada tabela
-- ---------------------------------------------------------------------
SELECT * FROM recrutador ORDER BY id_recrutador;
SELECT * FROM vaga ORDER BY id_vaga;
SELECT * FROM candidato ORDER BY id_candidato LIMIT 15;
SELECT * FROM candidatura ORDER BY id_candidatura LIMIT 15;

-- Quantidade de linhas por tabela
SELECT 'recrutador' AS tabela, COUNT(*) AS linhas FROM recrutador
UNION ALL SELECT 'vaga',        COUNT(*) FROM vaga
UNION ALL SELECT 'candidato',   COUNT(*) FROM candidato
UNION ALL SELECT 'candidatura', COUNT(*) FROM candidatura;


-- ---------------------------------------------------------------------
-- 1) JOIN COM 2 TABELAS
-- ---------------------------------------------------------------------
-- 1.1 Liste as vagas com o nome do recrutador responsável.
SELECT V.id_vaga, V.titulo, V.senioridade, V.status, R.nome AS recrutador
FROM vaga V INNER JOIN recrutador R
ON (V.id_recrutador = R.id_recrutador)
ORDER BY V.id_vaga;

-- 1.2 Liste os candidatos contratados, com a data e a pretensão salarial.
SELECT CA.nome AS candidato, CA.origem, C.data_candidatura, C.pretensao_salarial
FROM candidatura C INNER JOIN candidato CA
ON (C.id_candidato = CA.id_candidato)
WHERE (C.situacao = 'Contratado')
ORDER BY C.data_candidatura;


-- ---------------------------------------------------------------------
-- 2) JOIN COM PELO MENOS 2 TABELAS, GROUP BY E HAVING
-- ---------------------------------------------------------------------
-- 2.1 Para cada vaga, o recrutador e o total de candidaturas,
--     mostrando apenas as vagas com mais de 15 candidaturas (3 tabelas).
SELECT V.titulo, R.nome AS recrutador, COUNT(*) AS total_candidaturas
FROM candidatura C INNER JOIN vaga V
ON (C.id_vaga = V.id_vaga)
INNER JOIN recrutador R
ON (V.id_recrutador = R.id_recrutador)
GROUP BY V.titulo, R.nome
HAVING COUNT(*) > 15
ORDER BY total_candidaturas DESC;

-- 2.2 Por origem do candidato e senioridade da vaga, a pretensão salarial
--     média, apenas onde houver pelo menos 10 candidaturas (3 tabelas).
SELECT CA.origem, V.senioridade,
       COUNT(*)                          AS candidaturas,
       ROUND(AVG(C.pretensao_salarial),2) AS pretensao_media
FROM candidatura C INNER JOIN candidato CA
ON (C.id_candidato = CA.id_candidato)
INNER JOIN vaga V
ON (C.id_vaga = V.id_vaga)
GROUP BY CA.origem, V.senioridade
HAVING COUNT(*) >= 10
ORDER BY CA.origem, pretensao_media DESC;


-- ---------------------------------------------------------------------
-- 3) JOIN COM SUB SELECT
-- ---------------------------------------------------------------------
-- 3.1 Vagas (com recrutador) que receberam mais candidaturas do que a
--     média de candidaturas por vaga. Sub select no HAVING e no FROM.
SELECT V.titulo, R.nome AS recrutador, COUNT(*) AS total_candidaturas
FROM candidatura C INNER JOIN vaga V
ON (C.id_vaga = V.id_vaga)
INNER JOIN recrutador R
ON (V.id_recrutador = R.id_recrutador)
GROUP BY V.titulo, R.nome
HAVING COUNT(*) > (SELECT AVG(qtd)
                   FROM (SELECT COUNT(*) AS qtd
                         FROM candidatura
                         GROUP BY id_vaga) AS por_vaga
                  )
ORDER BY total_candidaturas DESC;

-- 3.2 Candidaturas com pretensão salarial mais de 30% acima da média da
--     mesma senioridade (sub select correlacionado no WHERE).
SELECT CA.nome AS candidato, V.titulo, V.senioridade, C.pretensao_salarial
FROM candidatura C INNER JOIN candidato CA
ON (C.id_candidato = CA.id_candidato)
INNER JOIN vaga V
ON (C.id_vaga = V.id_vaga)
WHERE C.pretensao_salarial > 1.3 * (SELECT AVG(C2.pretensao_salarial)
                                    FROM candidatura C2 INNER JOIN vaga V2
                                    ON (C2.id_vaga = V2.id_vaga)
                                    WHERE V2.senioridade = V.senioridade
                                   )
ORDER BY V.senioridade, C.pretensao_salarial DESC;

-- 3.3 Candidatos que se candidataram a mais de uma vaga, com as vagas
--     (sub select com IN, GROUP BY e HAVING dentro do sub select).
SELECT CA.nome AS candidato, CA.origem, V.titulo, C.situacao
FROM candidatura C INNER JOIN candidato CA
ON (C.id_candidato = CA.id_candidato)
INNER JOIN vaga V
ON (C.id_vaga = V.id_vaga)
WHERE C.id_candidato IN (SELECT id_candidato
                         FROM candidatura
                         GROUP BY id_candidato
                         HAVING COUNT(*) >= 5
                        )
ORDER BY CA.nome, V.titulo;
