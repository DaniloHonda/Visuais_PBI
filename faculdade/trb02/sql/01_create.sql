-- =====================================================================
-- TRB 02 - Bancos de Dados na Nuvem
-- Tema: Processo seletivo (dados fictícios)
-- SGBD: PostgreSQL 16 em máquina virtual AWS EC2 (AWS Academy Learner Lab)
-- Script 01: criação das tabelas
-- =====================================================================
-- Observação: no Oracle (slides da aula) usa-se "DROP TABLE x CASCADE CONSTRAINT".
-- No PostgreSQL o equivalente é "DROP TABLE IF EXISTS x CASCADE".

DROP TABLE IF EXISTS candidatura CASCADE;
DROP TABLE IF EXISTS candidato   CASCADE;
DROP TABLE IF EXISTS vaga        CASCADE;
DROP TABLE IF EXISTS recrutador  CASCADE;

-- Recrutador: pessoa responsável por conduzir as vagas
CREATE TABLE recrutador (
    id_recrutador  CHAR(4)      NOT NULL,
    nome           VARCHAR(40)  NOT NULL,
    area           VARCHAR(30)  NOT NULL,
    PRIMARY KEY (id_recrutador)
);

-- Vaga: posição aberta, conduzida por um recrutador
CREATE TABLE vaga (
    id_vaga        CHAR(4)      NOT NULL,
    titulo         VARCHAR(50)  NOT NULL,
    area           VARCHAR(30)  NOT NULL,
    senioridade    VARCHAR(15)  NOT NULL,
    data_abertura  DATE         NOT NULL,
    status         VARCHAR(15)  NOT NULL,
    id_recrutador  CHAR(4)      NOT NULL,
    PRIMARY KEY (id_vaga),
    FOREIGN KEY (id_recrutador) REFERENCES recrutador (id_recrutador),
    CHECK (senioridade IN ('Estágio', 'Júnior', 'Pleno', 'Sênior')),
    CHECK (status IN ('Aberta', 'Fechada', 'Congelada'))
);

-- Candidato: pessoa que se candidata a uma ou mais vagas
CREATE TABLE candidato (
    id_candidato   CHAR(5)      NOT NULL,
    nome           VARCHAR(50)  NOT NULL,
    cidade         VARCHAR(30)  NOT NULL,
    origem         VARCHAR(15)  NOT NULL,
    PRIMARY KEY (id_candidato),
    CHECK (origem IN ('LinkedIn', 'Indicação', 'Site', 'Evento'))
);

-- Candidatura: ligação entre candidato e vaga (tabela associativa)
CREATE TABLE candidatura (
    id_candidatura     INTEGER       NOT NULL,
    id_vaga            CHAR(4)       NOT NULL,
    id_candidato       CHAR(5)       NOT NULL,
    data_candidatura   DATE          NOT NULL,
    etapa              VARCHAR(20)   NOT NULL,
    situacao           VARCHAR(15)   NOT NULL,
    pretensao_salarial NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (id_candidatura),
    UNIQUE (id_vaga, id_candidato),
    FOREIGN KEY (id_vaga)      REFERENCES vaga (id_vaga),
    FOREIGN KEY (id_candidato) REFERENCES candidato (id_candidato),
    CHECK (etapa IN ('Triagem', 'Entrevista RH', 'Teste técnico', 'Entrevista gestor', 'Proposta')),
    CHECK (situacao IN ('Em andamento', 'Reprovado', 'Desistiu', 'Contratado'))
);
