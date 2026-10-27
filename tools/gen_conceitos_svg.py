# Refaz o conteúdo da página Conceitos (mantém cabeçalho, menu lateral e defs do SVG original).
import sys, re
from PIL import ImageFont
from xml.sax.saxutils import escape

SRC, DST = sys.argv[1], sys.argv[2]
F = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
_fc = {}
def width(t, size, bold=False):
    k = (size, bold)
    if k not in _fc: _fc[k] = ImageFont.truetype(FB if bold else F, 40)
    return _fc[k].getlength(t) * size / 40 * 0.93   # Segoe ~7% mais estreita

def wrap(t, size, maxw, bold=False):
    out, cur = [], ""
    for w in t.split(" "):
        nxt = (cur + " " + w).strip()
        if width(nxt, size, bold) <= maxw: cur = nxt
        else: out.append(cur); cur = w
    out.append(cur)
    return out

FONT = "font-family=\"'Segoe UI', Arial, sans-serif\""
def text(x, y, t, size, weight=400, fill="#1F1F1F", anchor="start"):
    return f'<text x="{x}" y="{y}" {FONT} font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{escape(t)}</text>'

L = []          # linhas do conteúdo
y = 140

def page_header():
    global y
    L.append(text(292, 172, "Como ler o dash de Esteiras", 30, 700))
    L.append(text(293, 206, "A regra dos números, o que cada conceito significa e por que alguns números parecem não bater.", 19, 400, "#6B6B6B"))
    y = 236

def top_cards(cards, h=170, dark_first=True):
    global y
    xs = [292, 828, 1364]
    for i, (lab, big, desc) in enumerate(cards):
        dark = dark_first and i == 0
        L.append(f'<g filter="url(#xpShadow)"><rect x="{xs[i]}" y="{y}" width="516" height="{h}" rx="20" fill="{"#121212" if dark else "white"}"/></g>')
        L.append(text(xs[i]+26, y+36, lab, 12.5, 700, "#F2D49B" if dark else "#6B6B6B"))
        L.append(text(xs[i]+26, y+72, big, 24 if dark else 22, 700, "white" if dark else "#1F1F1F"))
        yy = y + 104
        for ln in wrap(desc, 14, 464):
            L.append(text(xs[i]+26, yy, ln, 14, 400, "#D5D9E0" if dark else "#6B6B6B")); yy += 21
    y += h + 24

def pages_row():
    global y
    L.append(text(292, y+36, "As páginas", 22, 700)); y += 56
    cards = [("RESUMO", "A esteira está saudável?", "Big numbers, quantas aplicações precisamos para contratar, onde a esteira perde aplicações e o consumo do SLA."),
             ("REPORT", "Onde e com quem está o problema?", "Evolução no tempo e o detalhe por etapa, praça, recrutador e motivo de saída."),
             ("NOMINAL", "Quais aplicações estão por trás?", "Escolha a visão nos cards do topo: a lista mostra as aplicações de cada número, com link para o Greenhouse e linha do tempo."),
             ("DATA QUALITY", "O que ainda está errado na base?", "Alertas de processo e de dado, onde acontecem (recrutador, etapa, vaga) e a lista para corrigir.")]
    xs = [292, 694, 1096, 1498]
    for i, (lab, q, d) in enumerate(cards):
        L.append(f'<g filter="url(#xpShadow)"><rect x="{xs[i]}" y="{y}" width="382" height="170" rx="20" fill="white"/></g>')
        L.append(text(xs[i]+24, y+34, lab, 12.5, 700, "#067D84"))
        L.append(text(xs[i]+24, y+62, q, 16, 700))
        yy = y + 90
        for ln in wrap(d, 13.5, 334):
            L.append(text(xs[i]+24, yy, ln, 13.5, 400, "#6B6B6B")); yy += 20
    y += 170 + 40

def rule_block():
    global y
    h = 300
    L.append(f'<g filter="url(#xpShadow)"><rect x="292" y="{y}" width="1588" height="{h}" rx="20" fill="#E6F3F3"/></g>')
    L.append(f'<rect x="292" y="{y}" width="8" height="{h}" rx="4" fill="#067D84"/>')
    L.append(text(326, y+40, "A REGRA DO DASH", 12.5, 700, "#067D84"))
    L.append(text(326, y+76, "Todo número fala das aplicações com candidatura no período filtrado.", 24, 700))
    L.append(text(326, y+106, "Sobre essas aplicações perguntamos: quantas avançaram, quantas foram contratadas, rejeitadas ou seguem em processo, e quanto tempo levou.", 14.5, 400, "#3A3A3A"))
    L.append(text(326, y+132, "Ficam fora de todos os números as aplicações desconsideradas: Duplicate (chega sem motivo), Movimentação entre vagas e Posição cancelada.", 14.5, 700, "#04585D"))
    # exceções
    bx = [326, 1100]
    ex = [("Exceção 1 · Agenda de entrevistas", "Conta entrevistas (não aplicações), pela data da própria entrevista: marcadas no período (data de criação) e na agenda do período (data em que acontecem)."),
          ("Exceção 2 · Movimentações (gráfico de Evolução)", "Conta aprovações e rejeições nas etapas, pela data em que aconteceram. Uma aplicação aprovada em 5 etapas conta 5 vezes.")]
    for i, (t, d) in enumerate(ex):
        L.append(f'<rect x="{bx[i]}" y="{y+160}" width="752" height="116" rx="12" fill="white" stroke="#CDE7E8"/>')
        L.append(text(bx[i]+18, y+190, t, 15.5, 700))
        yy = y + 214
        for ln in wrap(d, 14, 712):
            L.append(text(bx[i]+18, yy, ln, 14, 400, "#3A3A3A")); yy += 21
    y += h + 24

def section(title, sub, items, bg="white"):
    """items: (titulo, descrição, regra)"""
    global y
    cw, maxw = 758, 722
    blocks = []
    for t, d, r in items:
        dl = wrap(d, 14, maxw); rl = wrap("Regra: " + r, 13, maxw) if r else []
        h = 30 + 24 + 21 * (len(dl) - 1) + (27 + 19 * (len(rl) - 1) if rl else 0) + 22
        blocks.append((t, dl, rl, h))
    rows = [blocks[i:i+2] for i in range(0, len(blocks), 2)]
    inner = sum(max(b[3] for b in row) + 12 for row in rows)
    H = 84 + inner + 14
    L.append(f'<g filter="url(#xpShadow)"><rect x="292" y="{y}" width="1588" height="{H}" rx="20" fill="{bg}"/></g>')
    L.append(text(318, y+40, title, 19, 700))
    L.append(text(318, y+64, sub, 13.5, 400, "#6B6B6B"))
    yy = y + 84
    for row in rows:
        rh = max(b[3] for b in row)
        for j, (t, dl, rl, h) in enumerate(row):
            x = 318 if j == 0 else 1096
            L.append(f'<rect x="{x}" y="{yy}" width="{cw}" height="{rh}" rx="12" fill="#F7F7F7" stroke="#E6E6E6"/>')
            ty = yy + 30
            L.append(text(x+18, ty, t, 15.5, 700)); ty += 24
            for k, ln in enumerate(dl):
                L.append(text(x+18, ty, ln, 14)); ty += 21
            ty += 6
            for k, ln in enumerate(rl):
                L.append(text(x+18, ty, ln, 13, 400, "#067D84")); ty += 19
        yy += rh + 12
    y += H + 24

def depara():
    global y
    rows = [("Resumo · Aplicações", "Aplicações", ""),
            ("Resumo · Contratadas", "Contratadas", "abas Direto, Via pool e Dentro do pool"),
            ("Resumo · Em andamento / Onde estão em andamento", "Em andamento", ""),
            ("Resumo · Funil", "Funil", "coluna “Chegou até”"),
            ("Resumo · Onde a esteira perde · Report · Entradas", "Entradas por etapa", "escolha a etapa no filtro Etapa"),
            ("Report · Rejeitados por etapa e Motivos de saída", "Rejeitados e motivos", "abas por tipo de encerramento"),
            ("Report · Aplicações em andamento por etapa", "Andamento por faixa", "abas por faixa de dias"),
            ("Resumo · Consumo do SLA · Report · SLA por etapa", "SLA por etapa", "aplicações com etapa concluída"),
            ("Report · Aprovados por recrutador", "Por recrutador", ""),
            ("Report · Evolução", "Evolução", "aplicações com aprovação ou rejeição no período"),
            ("Resumo · Entrevistas marcadas", "Entrevistas", "lista aplicações; o total de entrevistas fica na frase")]
    H = 84 + 40 + len(rows) * 44 + 20
    L.append(f'<g filter="url(#xpShadow)"><rect x="292" y="{y}" width="1588" height="{H}" rx="20" fill="white"/></g>')
    L.append(text(318, y+40, "Como conferir um número na Nominal", 19, 700))
    L.append(text(318, y+64, "Com os mesmos filtros, escolha a visão no topo da Nominal: o selo “✓ igual ao gráfico” confirma que a lista bate com o número.", 13.5, 400, "#6B6B6B"))
    yy = y + 84
    L.append(f'<rect x="318" y="{yy}" width="1536" height="40" rx="8" fill="#121212"/>')
    for x, t in [(338, "NÚMERO NO DASH"), (930, "VISÃO NA NOMINAL"), (1360, "OBSERVAÇÃO")]:
        L.append(text(x, yy+26, t, 12.5, 700, "white"))
    yy += 40
    for i, (a, b, c) in enumerate(rows):
        if i % 2: L.append(f'<rect x="318" y="{yy}" width="1536" height="44" fill="#F7F7F7"/>')
        L.append(text(338, yy+28, a, 14))
        L.append(text(900, yy+28, "→", 15, 700, "#067D84"))
        L.append(text(930, yy+28, b, 14.5, 700, "#067D84" if b != "não tem lista" else "#6B6B6B"))
        if c: L.append(text(1360, yy+28, c, 13, 400, "#6B6B6B"))
        yy += 44
    y += H + 24

def faq(items):
    global y
    cw, maxw = 758, 722
    blocks = []
    for q, a in items:
        ql = wrap(q, 15, maxw - 30, True); al = wrap(a, 14, maxw)
        h = 30 + 21 * (len(ql) - 1) + 26 + 21 * (len(al) - 1) + 22
        blocks.append((ql, al, h))
    rows = [blocks[i:i+2] for i in range(0, len(blocks), 2)]
    inner = sum(max(b[2] for b in row) + 12 for row in rows)
    H = 84 + inner + 14
    L.append(f'<g filter="url(#xpShadow)"><rect x="292" y="{y}" width="1588" height="{H}" rx="20" fill="#FFFBF3"/></g>')
    L.append(text(318, y+40, "Por que este número não bate?", 19, 700))
    L.append(text(318, y+64, "As diferenças conhecidas e a explicação de cada uma. Encontrou outra? Fale com People Analytics.", 13.5, 400, "#6B6B6B"))
    yy = y + 84
    for row in rows:
        rh = max(b[2] for b in row)
        for j, (ql, al, h) in enumerate(row):
            x = 318 if j == 0 else 1096
            L.append(f'<rect x="{x}" y="{yy}" width="{cw}" height="{rh}" rx="12" fill="white" stroke="#F2D49B"/>')
            L.append(f'<circle cx="{x+26}" cy="{yy+25}" r="9" fill="#E3A33B"/>')
            L.append(text(x+26, yy+30, "?", 12, 700, "white", "middle"))
            ty = yy + 30
            for ln in ql:
                L.append(text(x+44, ty, ln, 15, 700)); ty += 21
            ty += 5
            for ln in al:
                L.append(text(x+18, ty, ln, 14, 400, "#3A3A3A")); ty += 21
        yy += rh + 12
    y += H + 24

# ---------------- conteúdo ----------------
page_header()
top_cards([("COBERTURA DOS DADOS", "Desde 01/07/2026", "Só entram aplicações com candidatura a partir de 1º de julho de 2026. Períodos anteriores aparecem vazios."),
           ("FONTE", "Greenhouse", "Aplicações, etapas, candidatos e entrevistas agendadas. Substitui a planilha manual de esteiras."),
           ("ATUALIZAÇÃO", "Diária, às 06:00", "Os números refletem o Greenhouse até a noite anterior. A data e a hora da última carga ficam no topo de cada página.")])
pages_row()
rule_block()

section("Esteira, etapas e aplicação", "A estrutura do processo seletivo.", [
    ("Aplicação", "A candidatura de uma pessoa a uma vaga. Uma pessoa pode ter mais de uma aplicação.", "contamos aplicações únicas; a data que decide o período é a da candidatura."),
    ("Esteira", "Conjunto de vagas que seguem o mesmo processo seletivo, como B2C - XP Future. Vem pronta da base, a partir da especialidade e da persona da vaga.", "filtro “Esteira”. Aplicações de pool ainda vêm, em boa parte, sem esteira (em homologação)."),
    ("Etapa", "Cada passo do processo no Greenhouse: Revisão de aplicação, Mindsight, entrevistas, Offer e outras. Etapas como Senior, Pleno e Pool Qualificados são válidas.", "cada vaga tem a sua ordem de etapas; as regras por aplicação usam a ordem da própria vaga."),
    ("Etapa atual", "A etapa em que a aplicação está agora, ou em que terminou.", "a de entrada mais recente; empate: a que ainda está aberta e, depois, a mais avançada na vaga."),
    ("Passagem pela etapa", "Cada entrada da aplicação numa etapa, com data de entrada e de saída.", "quando a base traz a mesma etapa em dobro (mesmas datas), contamos uma passagem só."),
    ("Pool (Talent Pool)", "Vaga que reúne candidatos para várias posições. A pessoa pode sair do pool e ser contratada numa vaga.", "o tempo no pool conta no SLA de quem foi contratado depois."),
])

section("Situação da aplicação e resultado na etapa", "Toda aplicação do período está em exatamente uma situação: contratada, rejeitada, declinou ou em andamento.", [
    ("Participantes da etapa", "Aplicações do período que entraram na etapa. Etapa pulada (sem data de entrada) não conta.", "participantes = aprovados + rejeitados + em andamento + voltaram, na etapa."),
    ("Aprovado na etapa", "A aplicação entrou na etapa e seguiu para uma etapa mais à frente, ou foi contratada estando nela.", "ex.: Revisão → Phone Screening = 1 aprovado em Revisão; em Phone Screening fica em andamento."),
    ("Voltou", "A aplicação saiu da etapa e foi para uma etapa anterior do fluxo.", "não é aprovação; o tempo conta no SLA; aparece como alerta “Voltou de etapa”."),
    ("Rejeitada", "A aplicação foi encerrada. A rejeição conta em uma etapa só: a etapa atual, como no Greenhouse.", "se foi rejeitada, desrejeitada e rejeitada de novo, vale a última rejeição."),
    ("Declinou", "O candidato recusou seguir no processo ou a proposta (ver Motivos de encerramento).", "conta como rejeição na conversão, mas sai de “Rejeitados (Empresa)”."),
    ("Em andamento", "Aplicação do período que ainda está em processo, na etapa atual.", "status em processo no Greenhouse."),
    ("Parada", "Em andamento há mais de 45 dias na etapa atual.", "em períodos curtos (menos de 45 dias) é sempre zero."),
    ("Contratada", "Aplicação concluída com contratação. Data da contratação = fechamento da opening da vaga.", "entra no período da candidatura, não no da contratação."),
    ("Origem da contratação", "Direto: candidatura na própria vaga. Via pool: a pessoa veio de um pool. Dentro do pool: contratação registrada no próprio pool (não deveria acontecer).", "Via pool = havia aplicação de pool aberta antes da contratação."),
    ("Contratada via outra vaga", "Aplicação de pool encerrada porque a pessoa foi contratada em outra vaga.", "não é rejeição: a contratação conta na vaga final."),
    ("Organograma (N)", "Estrutura da vaga: N2 responde ao CEO, N3 ao N2, e assim por diante. Escolher um nome inclui tudo abaixo dele.", "cadeira da vaga na Gestão de Estruturas; sem cadeira = “(Sem organograma)”."),
    ("Indicação", "Aplicação de alguém indicado. Botão “Todas | Só indicações” no topo filtra o dash inteiro.", "1º Source = Referral com indicador; se não, Referred By preenchido no candidato."),
])

section("Motivos de encerramento", "Todo encerramento é classificado pelo motivo do Greenhouse em um destes tipos, combinados com os recrutadores em 27/10/2026.", [
    ("Rejeição pela XP (Avaliação)", "A XP decidiu não seguir: motivos de [Aplicação], [Avaliação] e [Qualificação] sobre o perfil, Empresa off limits, Candidato(a) AAI/B2B, Background Check, Problemas de documentação e Silver Medalist.", "conta como rejeitado e entra em “Rejeitados (Empresa)”."),
    ("Declínio do candidato", "O candidato recusou, em qualquer etapa: Anywhere (fora da praça, fora de SP, não quer híbrido ou presencial), remuneração (inclusive composição e acima da faixa), desconfortável com a meta, recebeu outra oferta, sem interesse na carreira, desistência no meio do processo, desistência pós-hired, motivos pessoais e preferiu outra posição na XP.", "conta como rejeição na conversão; “Declinou a offer” = os motivos que começam com [Offer]."),
    ("Administrativo", "Encerramento de organização, sem avaliar a pessoa: Limpeza de Pool e Move interno.", "conta como rejeição (em validação com os recrutadores)."),
    ("Desconsiderada", "Não é uma decisão sobre o candidato: Duplicate (mesma pessoa em duas aplicações, com e-mail ou telefone diferente, unificada depois; chega sem motivo na base), Movimentação entre vagas e Posição cancelada.", "sai de todos os números do dash: aplicações, rejeições e conversão."),
])

section("Conversão", "Só entram casos já decididos, para não penalizar quem ainda está em andamento.", [
    ("Conversão da etapa", "Dos decididos na etapa, quantos foram aprovados.", "aprovados ÷ (aprovados + rejeitados)."),
    ("Conversão da esteira", "Das aplicações do período que já tiveram desfecho, quantas foram contratadas.", "contratadas ÷ (contratadas + rejeitadas, com declínios e administrativos); desconsideradas ficam fora."),
    ("Conversão de entrevista", "Das entrevistas realizadas no período e já decididas, em quantas o candidato foi aprovado.", "aprovados ÷ (aprovados + rejeitados), pela etapa da entrevista."),
    ("Aplicações por contratação", "Quantas aplicações a esteira recebe para fazer uma contratação.", "aplicações ÷ contratadas. Ex.: 25 = a cada 25 aplicações, 1 contratação."),
    ("No recrutador, por contratação", "Quantas aplicações chegam ao recrutador para fazer uma contratação.", "aplicações que chegaram à Etapa com Recrutamento (ou além) ÷ contratadas."),
    ("Rejeitados (Empresa)", "Rejeições decididas pela XP.", "rejeitados − declínios do candidato."),
])

section("Entrevistas e movimentações (atividade do time)", "As duas exceções à regra: contam pela data em que as coisas aconteceram, não pela candidatura.", [
    ("Entrevistas marcadas", "Entrevistas que o time colocou na agenda no período. Mede a produtividade de quem agenda.", "data de criação no Greenhouse; conta entrevistas (3 entrevistas da mesma pessoa = 3)."),
    ("Entrevistas na agenda", "Entrevistas que acontecem no período: já realizadas + a realizar.", "data de início da entrevista; o status “to be scheduled” não entra."),
    ("Quem marcou", "A pessoa que organizou a entrevista no Greenhouse.", "campo Organizer Name."),
    ("Movimentações", "Aprovações e rejeições nas etapas, no gráfico de Evolução.", "data em que aconteceram; uma aplicação aprovada em 5 etapas conta 5."),
])

section("Tempo e SLA", "Quanto tempo a esteira leva, e o que conta ou não conta no tempo.", [
    ("SLA da esteira", "Dias do início do ciclo até a contratação. Meta: 45 dias.", "mediana das contratadas do período; início do ciclo = entrada no pool, se a pessoa veio de pool, senão a candidatura."),
    ("Pausa no Silver Medalist", "Enquanto a aplicação está na etapa Stand-by | Silver medalist, o SLA fica parado. Quando volta ao processo, volta a contar.", "os dias nessa etapa são descontados do SLA."),
    ("SLA (dias) na Nominal", "O mesmo SLA, também para quem não foi contratado: do início do ciclo até a rejeição, ou até hoje se segue em andamento.", "menos os dias no Silver Medalist."),
    ("Tempo na etapa", "Dias entre a entrada e a saída da etapa, em dias inteiros. O tempo de quem voltou de etapa também conta.", "só passagens concluídas; 0 d = resolvida no mesmo dia (comum em etapas automáticas)."),
    ("Média x mediana", "A mediana é o caso típico. Média bem acima da mediana indica poucos casos muito demorados.", "compare as duas antes de concluir que uma etapa é lenta."),
    ("P90", "Tempo em que 90% das aplicações já saíram da etapa.", "acima do P90 = caso fora do padrão."),
    ("Cores dos dias", "Nas listas, dias e SLA ganham selo: cinza até 30 dias, âmbar acima de 30 e coral acima de 45.", "45 dias = meta do SLA da esteira."),
    ("Mês atual x anterior · YTD", "Compara o mês corrente até hoje com os mesmos dias do mês anterior. YTD = acumulado do ano até hoje.", "ex.: 01 a 19/10 contra 01 a 19/09; o YTD começa em 01/07/2026."),
])

section("Data Quality: os alertas", "Uma aplicação pode ter mais de um alerta. Âmbar e coral mostram onde a taxa está alta.", [
    ("Contratada dentro do pool", "A contratação foi registrada na própria vaga de pool, em vez de mover a pessoa para a vaga final.", "qualquer caso fica coral. Corrigir no Greenhouse."),
    ("Voltou de etapa", "A aplicação foi para uma etapa anterior do fluxo. O número entre parênteses é quantas vezes.", "âmbar acima de 5% das aplicações, coral acima de 10%; 3 vezes ou mais fica coral na lista."),
    ("Etapa sem nome", "A etapa existe na base, mas veio sem nome: conta no SLA e não aparece nos gráficos por etapa.", "âmbar acima de 0,5%, coral acima de 1%. Corrigir na engenharia."),
    ("Etapa antes da candidatura", "Uma etapa tem entrada mais de 1 dia antes da candidatura (data errada ou migração).", "âmbar acima de 0,1%, coral acima de 0,5%. Corrigir na engenharia."),
    ("Etapas em dobro na origem", "A mesma etapa veio repetida na base, com as mesmas datas. O dash já usa uma passagem só.", "âmbar acima de 2%, coral acima de 5%. Corrigir na engenharia."),
    ("Onde acontece", "Recrutador, etapa, vaga, esteira ou especialidade com taxa de alerta bem acima da média geral.", "com 20 ou mais aplicações: âmbar a partir de 1,5× a taxa geral, coral a partir de 2×."),
])

depara()

faq([
    ("Conversão baixa, SLA curto e muitas aplicações por contratação em um período recente. Está errado?",
     "Não. Pela data de candidatura, aplicações recentes ainda não terminaram o processo: só as contratações rápidas já aconteceram. Para leitura gerencial, use períodos com mais de 45 dias ou já fechados."),
    ("O total de aplicações ficou menor do que no Greenhouse.",
     "As desconsideradas (Duplicate, Movimentação entre vagas e Posição cancelada) saem de todos os números. Hoje são cerca de 5% das aplicações."),
    ("O número de Entrevistas no menu da Nominal é menor que o do Resumo.",
     "O Resumo conta entrevistas; a lista da Nominal conta aplicações com entrevista. Uma pessoa com 3 entrevistas é 3 no Resumo e 1 linha na lista. O total de entrevistas aparece na frase do topo da lista."),
    ("Entrevistas marcadas é diferente de entrevistas na agenda.",
     "São perguntas diferentes: marcadas usa o dia em que o time agendou; na agenda, o dia em que a entrevista acontece. Uma entrevista marcada em setembro para outubro conta em meses diferentes."),
    ("O gráfico de Evolução mostra números maiores que os cards.",
     "A Evolução conta movimentações: cada aprovação ou rejeição em cada etapa, pela data em que aconteceu. Os cards contam aplicações do período."),
    ("O SLA de uma pessoa é menor do que as datas sugerem.",
     "Os dias parados no Silver Medalist não contam no SLA. E, para quem veio de pool, o SLA começa na entrada no pool, não na candidatura da vaga final."),
    ("Uma aplicação aparece como “Voltou” numa etapa em que ela foi aprovada no Greenhouse.",
     "Voltou = depois dessa etapa a aplicação foi para uma etapa anterior. O tempo conta, mas não é aprovação. Muitas voltas são ajuste de cadastro feito na hora."),
    ("A soma dos recrutadores é menor que o total.",
     "Aplicações de vagas sem recrutador cadastrado entram no total, mas não em nenhum recrutador. Na Nominal, use a visão Por recrutador e procure o recrutador vazio."),
    ("“Rejeitados (Empresa)” é menor que o total de rejeitados.",
     "Rejeitados (Empresa) tira os declínios do candidato. Os declínios continuam contando na conversão da esteira."),
    ("Ao filtrar uma esteira, muitas aplicações somem.",
     "Boa parte das aplicações de pool ainda vem sem esteira na base. A regra está em homologação com a engenharia."),
    ("SLA mediano de 0 dia em algumas etapas.",
     "O tempo é contado em dias inteiros. Etapas resolvidas no mesmo dia (triagens e etapas automáticas) ficam com 0."),
    ("“Paradas há mais de 45 dias” aparece zerado.",
     "Com um período menor que 45 dias, nenhuma aplicação do período tem 45 dias de processo ainda."),
    ("Uma contratação de julho não aparece.",
     "Os dados começam em 01/07/2026: quem se candidatou antes disso não entra, mesmo contratado depois."),
    ("Uma pessoa aparece como indicação em uma vaga para a qual não foi indicada.",
     "A 2ª regra de indicação (Referred By) é do candidato, não da aplicação: vale para todas as aplicações da pessoa."),
    ("Algumas aplicações aparecem como “(Sem organograma)” no filtro de N.",
     "A vaga dessas aplicações não tem cadeira cadastrada na Gestão de Estruturas. Elas contam no total, mas somem quando um N é escolhido."),
    ("A data no dash é 1 dia diferente do Greenhouse.",
     "As datas da base estão em UTC e sem hora: eventos depois das 21h podem cair no dia seguinte."),
])

section("Limitações conhecidas", "Leia antes de tirar conclusões.", [
    ("Histórico curto", "Só há dados a partir de julho de 2026: comparações com períodos anteriores ainda não são possíveis.", ""),
    ("Entrevistas fora do Greenhouse", "Entrevistas marcadas por fora do Greenhouse não aparecem na agenda nem na conversão de entrevista.", ""),
    ("Esteira vazia", "Aplicações de pool e algumas vagas vêm sem esteira; o filtro Esteira não mostra essas aplicações.", ""),
    ("Datas sem hora", "Idas e voltas no mesmo dia podem parecer passagens repetidas; a ordem é desempatada pela etapa da vaga.", ""),
    ("Mês corrente parcial", "O mês atual é comparado com os mesmos dias do mês anterior, não com o mês inteiro.", ""),
    ("Baixa no Greenhouse", "Candidatos sem baixa no Greenhouse continuam “em andamento” e podem aparecer como parados.", ""),
], bg="#FFFBF3")

L.append(text(292, y + 10, "Dúvidas sobre os conceitos: time de People Analytics.", 13, 400, "#6B6B6B"))
H = int(y + 60)

# ---------------- montagem ----------------
# Funciona com o SVG original (marcador "O que é a visão de Esteiras") ou com um já gerado ("Como ler o dash de Esteiras").
src = open(SRC, encoding="utf-8").read().split("\n")
start = next(i for i, l in enumerate(src) if "O que é a visão de Esteiras" in l or "Como ler o dash de Esteiras" in l)
end = next(i for i, l in enumerate(src) if l.strip() == "</g>" and i > start)
head, tail = src[:start], src[end:]
OLD = int(re.search(r'height="(\d+)"', src[0]).group(1))
def fix(l):
    l = l.replace(f'height="{OLD}"', f'height="{H}"').replace(f'viewBox="0 0 1900 {OLD}"', f'viewBox="0 0 1900 {H}"')
    l = l.replace(f"translate(0 {OLD - 1500})", f"translate(0 {H - 1500})")
    l = l.replace("Conceitos: como ler o dashboard e o que cada número significa", "Conceitos: a regra dos números, o dicionário e as justificativas")
    return l
head = [fix(l) for l in head]; tail = [fix(l) for l in tail]
open(DST, "w", encoding="utf-8").write("\n".join(head + L + tail))
print("altura", H)
