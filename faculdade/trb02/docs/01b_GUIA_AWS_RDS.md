# Guia 1B · Banco no Amazon RDS (caminho do material do professor)

Este guia segue o mesmo caminho do material do professor (`_01_Maquina_sqlmack`, `_02_Instancia_sqlmack`, `conexao_mysql`):
**RDS → Security Group com Meu IP → cliente SQL no seu computador → Power BI/Python**.

A diferença: em vez de SQL Server, usamos **RDS PostgreSQL**. Assim todos os scripts e os dois dashboards já
prontos funcionam **sem nenhuma alteração** (foram testados no PostgreSQL 16).

📸 = momento de tirar print para o relatório.

| Material do professor | Neste trabalho |
|---|---|
| RDS · SQL Server Express · Free tier · `sqlmack` | RDS · **PostgreSQL** · Free tier · `trb02-postgres` |
| SQL Server Management Studio (SSMS) | **pgAdmin 4** (ou DBeaver) |
| Banco `bdvendas` | Banco `recrutamento` |
| Security Group: inbound **My IP** | Igual: inbound PostgreSQL 5432 **Meu IP** |
| Power BI → Banco de dados SQL Server | Power BI → Banco de dados PostgreSQL (opcional) |
| (sem Python) | 2 dashboards Python: `dashboard.py` e `dashboard_recrutadores.py` |

---

## 0. Entrar no Learner Lab

awsacademy.instructure.com → curso do Learner Lab → **Módulos → Launch AWS Academy Learner Lab → Start Lab** →
espere a bolinha verde → clique em **AWS**. Região: **N. Virginia (us-east-1)**.

> No Learner Lab o RDS **também para** quando a sessão acaba e volta no próximo *Start Lab*.
> Diferente da EC2, o **endpoint do RDS não muda**.

## 1. Criar o banco (RDS)

Console → pesquise **RDS** → **Criar banco de dados** (*Create database*).

| Campo | Valor |
|---|---|
| Método | **Criação padrão** (*Standard create*) |
| Mecanismo | **PostgreSQL** (versão padrão sugerida) |
| Modelo | **Nível gratuito** (*Free tier*). Se não aparecer, use *Dev/Test* e ajuste os itens abaixo |
| Identificador da instância | `trb02-postgres` |
| Nome do usuário principal | `trb02` |
| Gerenciamento de credenciais | **Autogerenciado**, digite e confirme a senha (guarde, não mostre nos prints) |
| Classe da instância | **db.t3.micro** (ou db.t4g.micro) |
| Armazenamento | gp2 ou gp3, **20 GiB**, autoscaling **desmarcado** |
| Conectividade → Recurso de computação | **Não se conectar a um recurso de computação do EC2** |
| **Acesso público** | **Sim** (igual ao material: *Public accessibility: Yes*) |
| Grupo de segurança de VPC | **Criar novo** → nome `trb02-rds-sg` |
| Porta | 5432 |
| Autenticação | Autenticação por senha |
| Monitoramento | **Desmarque** *Performance Insights* e *Monitoramento avançado* (o Learner Lab não deixa criar a função IAM que ele exige; se ficar marcado, a criação falha) |
| Configuração adicional → **Nome do banco de dados inicial** | `recrutamento` ⚠️ não esqueça |
| Backup automático | Desmarcado (ou retenção 0 dias, como no material) |
| Proteção contra exclusão | Desmarcada |

**Criar banco de dados.** Leva de 5 a 10 minutos até o status ficar **Disponível**.

📸 **Print 1**: lista *Bancos de dados* com `trb02-postgres` **Disponível** (como na pág. 10 do material).
📸 **Print 2**: aba **Conectividade e segurança** (endpoint, porta 5432, acessível publicamente: Sim, grupo de segurança).
📸 **Print 3**: aba **Configuração** (mecanismo, versão, classe db.t3.micro, armazenamento).

## 2. Liberar o seu IP (Security Group)

Na aba *Conectividade e segurança*, clique no grupo `trb02-rds-sg` → **Regras de entrada** → **Editar regras de entrada**.
Deve existir: **PostgreSQL · TCP · 5432 · Origem: Meu IP** (`x.x.x.x/32`). Se não existir, adicione e **Salvar regras**.

📸 **Print 4**: regras de entrada (como no `conexao_mysql.docx` do professor).

> Diferença em relação ao material: lá a regra é *All traffic*. Aqui liberamos **só a porta 5432**, que é mais seguro.
> Se você mudar de rede (casa → faculdade), edite a regra e escolha **Meu IP** de novo.

## 3. Conectar pelo seu computador (pgAdmin, o "SSMS" do PostgreSQL)

1. Instale o **pgAdmin 4**: https://www.pgadmin.org/download/
2. *Servers* (botão direito) → **Register → Server…**
   - Aba *General* · Name: `TRB02 RDS`
   - Aba *Connection* · Host: **endpoint do RDS** (ex.: `trb02-postgres.xxxx.us-east-1.rds.amazonaws.com`) · Port `5432` ·
     Maintenance database `recrutamento` · Username `trb02` · Password (sua senha)
   - **Save**.

📸 **Print 5**: tela de registro com o endpoint preenchido (senha oculta), como a pág. 1 do `_02_Instancia`.
📸 **Print 6**: árvore do pgAdmin conectada, mostrando o banco `recrutamento`.

> Se der *timeout*, o problema é o Security Group (o seu IP mudou) ou *Acesso público = Não*.

## 4. Executar os scripts

No pgAdmin: clique em `recrutamento` → **Tools → Query Tool**. Para cada script: **abrir arquivo** (ícone de pasta) →
selecione o `.sql` → **Execute (F5)**.

| Ordem | Arquivo | O que conferir | Print |
|---|---|---|---|
| 1 | `sql/01_create.sql` | *Query returned successfully* · em *Schemas → public → Tables* (botão direito → Refresh) aparecem as 4 tabelas | 📸 7 |
| 2 | `sql/02_insert.sql` | Termina sem erro (COMMIT) | 📸 8 |
| 3 | Contagem (início do `03_selects.sql`) | 6 · 20 · 180 · 320 | 📸 9 |
| 4 | Cada consulta do `03_selects.sql` | **Selecione só aquela consulta** e aperte F5: o resultado aparece embaixo (*Data Output*) | 📸 10 a 17 |
| 5 | `sql/04_views.sql` | Em *Views* aparecem as 3 views | 📸 18 |

Prints obrigatórios das consultas (pode usar a tabela de prints do Guia 1, seção 5):
- **1.1 / 1.2**: JOIN com 2 tabelas
- **2.1 / 2.2**: JOIN com 2 ou mais tabelas + GROUP BY + HAVING
- **3.1 / 3.2 / 3.3**: JOIN com sub select

> Opcional, equivalente à pág. 4 do material (*Propriedades do Servidor*): rode `SELECT version();` e
> `SELECT current_database(), inet_server_addr();` e tire print. Isso mostra o servidor na nuvem.

## 5. Dashboards

Os dois dashboards Python funcionam iguais, só trocando o host pelo **endpoint do RDS**:

```powershell
$env:DB_HOST="trb02-postgres.xxxx.us-east-1.rds.amazonaws.com"; $env:DB_PASSWORD="SUA_SENHA"; streamlit run dashboard.py
```

```powershell
$env:DB_HOST="trb02-postgres.xxxx.us-east-1.rds.amazonaws.com"; $env:DB_PASSWORD="SUA_SENHA"; streamlit run dashboard_recrutadores.py
```

A conexão usa SSL automaticamente, como o RDS exige. Veja o Guia 3 para os prints.

**Power BI (opcional):** *Obter dados → Banco de dados PostgreSQL* → Servidor = endpoint · Banco = `recrutamento` →
credenciais da aba **Banco de dados** (`trb02` + senha), como nas págs. 6 a 9 do material.
O RDS PostgreSQL **exige SSL**. Se o Power BI recusar o certificado:
1. baixe o certificado `us-east-1-bundle.pem` em https://truststore.pki.rds.amazonaws.com/us-east-1/us-east-1-bundle.pem ;
2. renomeie para `.crt`, clique duas vezes → *Instalar certificado* → *Máquina local* → *Autoridades de Certificação Raiz Confiáveis*;
3. reabra o Power BI e conecte de novo (com *Criptografar conexões* **marcado**).

## 6. Depois da entrega

**End Lab** ao terminar. Depois que a nota sair: RDS → selecione `trb02-postgres` → **Ações → Excluir**
(sem snapshot final).
