# Guia 1 · Máquina e banco na AWS Academy Learner Lab

Objetivo: uma EC2 Ubuntu com PostgreSQL 16, com o banco `recrutamento` criado e carregado,
acessível do seu computador (Power BI e Python).

📸 = momento de tirar print para o relatório.

---

## 0. Entrar no Learner Lab (mesma conta da atividade anterior)

1. Acesse **https://awsacademy.instructure.com** e entre com o **mesmo login** que você usou na atividade anterior.
2. Em **Cursos**, abra o curso do Learner Lab (o mesmo da outra atividade).
3. **Módulos → Launch AWS Academy Learner Lab**.
4. Clique em **Start Lab**. Espere a bolinha ao lado de **AWS** ficar **verde** (de 1 a 5 minutos).
5. Clique em **AWS** (a palavra, com a bolinha verde). O console abre numa nova aba.
6. Confira a região no canto superior direito: **N. Virginia (us-east-1)**.

> **Como o Learner Lab funciona (importante):**
> - Cada sessão dura **4 horas** (contador no topo). Quando acaba, a AWS **para** suas instâncias, mas **não apaga** nada.
>   No próximo *Start Lab* elas voltam a ligar sozinhas.
> - O **IP público muda** toda vez que a instância é religada. Anote o IP novo a cada sessão (Power BI e Python usam esse IP).
> - Há um **orçamento** (ex.: US$ 50 ou 100) mostrado no topo do Learner Lab. Uma t3.micro custa cerca de US$ 0,01/hora: este trabalho gasta centavos.
> - Como é a **mesma conta da atividade anterior**, o que você criou lá **ainda existe**. Antes de começar, veja **EC2 → Instâncias**.
>   Se houver instâncias antigas que você não usa mais (e que a nota anterior já foi dada), selecione → **Estado da instância → Encerrar** para não gastar crédito.
>   Na dúvida, deixe só **parada** (*Interromper*).

## 1. Criar a máquina virtual (EC2)

No console: pesquise **EC2** → **Executar instâncias** (*Launch instances*).

| Campo | Valor |
|---|---|
| Nome | `trb02-postgres` |
| AMI | **Ubuntu Server 24.04 LTS** (qualificada para nível gratuito) |
| Tipo de instância | **t3.micro** (ou t2.micro) |
| Par de chaves | **vockey** (já existe no Learner Lab) |
| Configurações de rede → Firewall | **Criar grupo de segurança**, nome `trb02-sg` |
| Regra 1 | SSH · porta 22 · Origem: **Meu IP** |
| Regra 2 (*Adicionar regra do grupo de segurança*) | **PostgreSQL** · porta 5432 · Origem: **Meu IP** |
| Armazenamento | 8 GiB gp3 (padrão) |

Clique em **Executar instância**. Vá em **Instâncias** e espere *Estado: Executando* e *Verificações de status: 2/2*.

📸 **Print 1**: lista de instâncias com `trb02-postgres` *Executando*.
📸 **Print 2**: aba **Detalhes** da instância (tipo, IP público, AMI) e a aba **Segurança** com as regras 22 e 5432.

> ⚠️ Nunca use origem `0.0.0.0/0` na porta 5432: isso abre o banco para a internet toda.
> Se você mudar de rede (casa → faculdade), edite as regras do `trb02-sg` e escolha **Meu IP** de novo.

## 2. Entrar na máquina

Selecione a instância → **Conectar** → aba **EC2 Instance Connect** → usuário `ubuntu` → **Conectar**.
Abre um terminal no navegador, sem precisar de chave.

> Alternativa pelo seu computador: no Learner Lab, **AWS Details → Download PEM** e então
> `ssh -i labsuser.pem ubuntu@IP_PUBLICO`.

📸 **Print 3**: terminal conectado (aparece `ubuntu@ip-...:~$`).

## 3. Instalar e configurar o PostgreSQL

Cole no terminal da EC2, um bloco por vez:

```bash
sudo apt update && sudo apt install -y postgresql
```

```bash
sudo systemctl status postgresql --no-pager
psql --version
```

📸 **Print 4**: serviço *active* e a versão (PostgreSQL 16).

Crie o usuário e o banco. **Troque `SUA_SENHA_FORTE`** e guarde a senha (não a mostre nos prints):

```bash
sudo -u postgres psql -c "CREATE ROLE trb02 LOGIN PASSWORD 'SUA_SENHA_FORTE';"
sudo -u postgres psql -c "CREATE DATABASE recrutamento OWNER trb02;"
```

Libere o acesso de fora (o Security Group continua limitando ao seu IP):

```bash
sudo sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf
echo "host  recrutamento  trb02  0.0.0.0/0  scram-sha-256" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf
sudo systemctl restart postgresql
sudo ss -tlnp | grep 5432
```

A última linha deve mostrar `0.0.0.0:5432`, o que indica que o banco está escutando conexões externas.

## 4. Levar os scripts para a máquina

Os scripts estão em `faculdade/trb02/sql/`. O jeito mais simples é criar cada arquivo com o `nano` e colar o conteúdo:

```bash
mkdir -p ~/trb02 && cd ~/trb02
nano 01_create.sql
```

Cole o conteúdo do arquivo (botão direito → colar). Salve com **Ctrl+O**, **Enter** e saia com **Ctrl+X**.
Repita para `02_insert.sql`, `03_selects.sql` e `04_views.sql`.

> Dica: o `02_insert.sql` tem cerca de 540 linhas. Colar no Instance Connect funciona, mas é bom conferir o fim do arquivo com `tail -3 02_insert.sql` (deve terminar em `COMMIT;`).

## 5. Executar os scripts (é aqui que saem os prints do SQL)

Entre no banco:

```bash
cd ~/trb02
psql -h localhost -U trb02 -d recrutamento
```

Dentro do `psql` (prompt `recrutamento=>`):

```sql
\i 01_create.sql
\dt
\d candidatura
```

📸 **Print 5**: execução do `01_create.sql` + `\dt` (4 tabelas) + `\d candidatura` (colunas, PK e FKs).

```sql
\i 02_insert.sql
SELECT 'recrutador' AS tabela, COUNT(*) FROM recrutador
UNION ALL SELECT 'vaga', COUNT(*) FROM vaga
UNION ALL SELECT 'candidato', COUNT(*) FROM candidato
UNION ALL SELECT 'candidatura', COUNT(*) FROM candidatura;
```

📸 **Print 6**: final da execução dos INSERTs (`COMMIT`) e as contagens (6 · 20 · 180 · 320).

Agora as consultas. Para prints limpos, rode **uma consulta por vez**, copiando do `03_selects.sql`:

```sql
\pset border 2
```

| Print | Consulta | Requisito atendido |
|---|---|---|
| 📸 7 | 0) `SELECT * FROM recrutador` e `SELECT * FROM vaga` | Exibir os dados |
| 📸 8 | 1.1 vagas + recrutador | **JOIN com 2 tabelas** |
| 📸 9 | 1.2 contratados | JOIN com 2 tabelas |
| 📸 10 | 2.1 vagas com mais de 15 candidaturas | **JOIN ≥2 tabelas + GROUP BY + HAVING** |
| 📸 11 | 2.2 origem × senioridade | JOIN + GROUP BY + HAVING |
| 📸 12 | 3.1 vagas acima da média | **JOIN com sub select** |
| 📸 13 | 3.2 pretensão 30% acima da média | JOIN com sub select correlacionado |
| 📸 14 | 3.3 candidatos com 5+ vagas | JOIN com sub select (IN) |

Por fim, as views dos dashboards:

```sql
\i 04_views.sql
\dv
```

📸 **Print 15**: `\dv` listando `vw_candidaturas`, `vw_vagas_mais_15` e `vw_vagas_acima_media`.

Saia com `\q`.

## 6. Testar a conexão do seu computador

No **Power BI** ou no **Python** (Guias 2 e 3), use:

| | |
|---|---|
| Servidor / host | IP público da EC2 (Detalhes da instância) |
| Porta | 5432 |
| Banco | `recrutamento` |
| Usuário | `trb02` |
| Senha | a que você definiu |

Se não conectar: (1) confira se o IP público não mudou; (2) confira se a regra 5432 está com o **seu IP atual**; (3) rode `sudo ss -tlnp | grep 5432` na EC2.

## 7. Depois da entrega

- **End Lab** no Learner Lab ao terminar cada sessão.
- Depois que a nota sair: **EC2 → Instâncias → Encerrar** `trb02-postgres`.
