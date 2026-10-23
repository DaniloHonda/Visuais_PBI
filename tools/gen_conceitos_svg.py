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
             ("NOMINAL", "Quais aplicações estão por trás?", "A lista de cada número, com link para o Greenhouse. Use para conferir: os cards batem com o Resumo e o Report.")]
    xs = [292, 828, 1364]
    for i, (lab, q, d) in enumerate(cards):
        L.append(f'<g filter="url(#xpShadow)"><rect x="{xs[i]}" y="{y}" width="516" height="150" rx="20" fill="white"/></g>')
        L.append(text(xs[i]+26, y+34, lab, 12.5, 700, "#067D84"))
        L.append(text(xs[i]+26, y+62, q, 17, 700))
        yy = y + 90
        for ln in wrap(d, 14, 464):
            L.append(text(xs[i]+26, yy, ln, 14, 400, "#6B6B6B")); yy += 21
    y += 150 + 40

def rule_block():
    global y
    h = 262
    L.append(f'<g filter="url(#xpShadow)"><rect x="292" y="{y}" width="1588" height="{h}" rx="20" fill="#E6F3F3"/></g>')
    L.append(f'<rect x="292" y="{y}" width="8" height="{h}" rx="4" fill="#067D84"/>')
    L.append(text(326, y+40, "A REGRA DO DASH", 12.5, 700, "#067D84"))
    L.append(text(326, y+76, "Todo número fala das aplicações com candidatura no período filtrado.", 24, 700))
    L.append(text(326, y+106, "Sobre essas aplicações perguntamos: quantas avançaram, quantas foram contratadas, rejeitadas ou seguem em processo, e quanto tempo levou.", 14.5, 400, "#3A3A3A"))
    # exceções
    bx = [326, 1100]
    ex = [("Exceção 1 · Agenda de entrevistas", "Conta entrevistas (não aplicações), pela data da própria entrevista: marcadas no período (data de criação) e na agenda do período (data em que acontecem)."),
          ("Exceção 2 · Movimentações (gráfico de Evolução)", "Conta aprovações e rejeições nas etapas, pela data em que aconteceram. Uma aplicação aprovada em 5 etapas conta 5 vezes.")]
    for i, (t, d) in enumerate(ex):
        L.append(f'<rect x="{bx[i]}" y="{y+128}" width="752" height="110" rx="12" fill="white" stroke="#CDE7E8"/>')
        L.append(text(bx[i]+18, y+158, t, 15.5, 700))
        yy = y + 182
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
    rows = [("Resumo · Aplicações", "Todas", ""),
            ("Resumo · Contratados", "Contratadas", ""),
            ("Resumo · Em andamento", "Em andamento", ""),
            ("Resumo · Conversão (“X decididos”)", "Contratadas + Rejeitadas + Declinaram", ""),
            ("Report · Rejeitados (por etapa ou por recrutador)", "Rejeitadas + Declinaram", "no Report as duas vêm somadas"),
            ("Report · Rejeitados por etapa: “Declinaram a offer”", "Declinaram", ""),
            ("Resumo · Entrevistas marcadas", "Entrevistas agendadas", "por enquanto a Nominal conta aplicações e o Resumo conta entrevistas"),
            ("Report · Evolução (movimentações)", "não tem lista", "são eventos, não aplicações")]
    H = 84 + 40 + len(rows) * 44 + 20
    L.append(f'<g filter="url(#xpShadow)"><rect x="292" y="{y}" width="1588" height="{H}" rx="20" fill="white"/></g>')
    L.append(text(318, y+40, "Como conferir um número na Nominal", 19, 700))
    L.append(text(318, y+64, "Com os mesmos filtros, o card da Nominal mostra exatamente as aplicações por trás de cada número do dash.", 13.5, 400, "#6B6B6B"))
    yy = y + 84
    L.append(f'<rect x="318" y="{yy}" width="1536" height="40" rx="8" fill="#121212"/>')
    for x, t in [(338, "NÚMERO NO DASH"), (930, "CARD NA NOMINAL"), (1360, "OBSERVAÇÃO")]:
        L.append(text(x, yy+26, t, 12.5, 700, "white"))
    yy += 40
    for i, (a, b, c) in enumerate(rows):
        if i % 2: L.append(f'<rect x="318" y="{yy}" width="1536" height="44" fill="#F7F7F7"/>')
        L.append(text(338, yy+28, a, 14.5))
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
    ("Esteira", "Conjunto de vagas que seguem o mesmo processo seletivo, como B2C - XP Future.", "filtro “Esteira”; todos os números respeitam a esteira escolhida."),
    ("Etapa", "Cada passo do processo no Greenhouse: Revisão de aplicação, Mindsight, entrevistas, Offer e outras.", "exibidas sempre na ordem do processo."),
    ("Grupo de etapas", "Etapas agrupadas para a visão executiva: Triagem, Avaliações, Entrevistas, Checagens e Offer.", "o ⓘ de cada grupo mostra as etapas que ele reúne."),
    ("Aplicação", "A candidatura de uma pessoa a uma vaga. Uma pessoa pode ter mais de uma aplicação.", "contamos aplicações únicas; a data que decide o período é a da candidatura."),
])

section("Situação da aplicação", "Toda aplicação do período está em exatamente uma situação: contratada, rejeitada (pela XP ou declinou) ou em andamento.", [
    ("Participantes da etapa", "Aplicações do período que entraram na etapa.", "participantes = aprovados + rejeitados + em andamento na etapa."),
    ("Aprovado na etapa", "Passou pela etapa sem ser rejeitado e já seguiu adiante.", "não saiu na etapa e não está mais nela."),
    ("Rejeitado", "A aplicação foi encerrada naquela etapa, por decisão da XP ou do candidato.", "saiu na etapa. Na Nominal, separado em Rejeitadas (pela XP) e Declinaram."),
    ("Declinou", "O candidato recusou a proposta. É um tipo de rejeição, típico de Pré Offer e Offer.", "rejeitada com motivo que começa com “[Offer]”."),
    ("Em andamento", "Aplicação do período que ainda está em processo, parada na etapa mais recente em que entrou.", "status em processo; etapa atual = última entrada (empate: a mais avançada)."),
    ("Parada", "Em andamento há mais de 45 dias na etapa atual.", "em períodos curtos (menos de 45 dias) é sempre zero."),
    ("Contratada", "Aplicação concluída com contratação.", "status hired no Greenhouse; entra no período da candidatura, não da contratação."),
    ("Organograma (N)", "Estrutura da vaga: N2 responde ao CEO, N3 ao N2, e assim por diante. Escolher um nome inclui tudo abaixo dele.", "cadeira da vaga na Gestão de Estruturas; vagas sem cadeira aparecem como \u201c(Sem organograma)\u201d."),
    ("Indicação", "Aplicação de alguém indicado. Botão “Todas | Só indicações” no topo filtra o dash inteiro.", "1º Source = Referral com indicador preenchido; se não, Referred By preenchido no candidato."),
])

section("Conversão", "Só entram casos já decididos, para não penalizar quem ainda está em andamento.", [
    ("Conversão da etapa", "Dos decididos na etapa, quantos foram aprovados.", "aprovados ÷ (aprovados + rejeitados)."),
    ("Conversão da esteira", "Das aplicações do período que já tiveram desfecho, quantas foram contratadas.", "contratadas ÷ (contratadas + rejeitadas)."),
    ("Conversão de entrevista", "Das entrevistas realizadas no período e já decididas, em quantas o candidato foi aprovado.", "aprovados ÷ (aprovados + rejeitados), pela etapa da entrevista."),
    ("Aplicações por contratação", "Quantas aplicações a esteira recebe para fazer uma contratação.", "aplicações ÷ contratadas. Ex.: 25 = a cada 25 aplicações, 1 contratação."),
    ("No recrutador, por contratação", "Quantas aplicações chegam ao recrutador para fazer uma contratação.", "aplicações que chegaram à Etapa com Recrutamento (ou além) ÷ contratadas."),
])

section("Entrevistas e movimentações (atividade do time)", "As duas exceções à regra: contam pela data em que as coisas aconteceram, não pela candidatura.", [
    ("Entrevistas marcadas", "Entrevistas que o time colocou na agenda no período. Mede a produtividade de quem agenda.", "data de criação no Greenhouse; conta entrevistas (3 entrevistas da mesma pessoa = 3)."),
    ("Entrevistas na agenda", "Entrevistas que acontecem no período: já realizadas + a realizar.", "data de início da entrevista; o status “to be scheduled” não entra."),
    ("Quem marcou", "A pessoa que organizou a entrevista no Greenhouse.", "campo Organizer Name."),
    ("Movimentações", "Aprovações e rejeições nas etapas, no gráfico de Evolução.", "data em que aconteceram; uma aplicação aprovada em 5 etapas conta 5."),
])

section("Tempo, SLA e comparações", "Quanto tempo a esteira leva e como os períodos são comparados.", [
    ("SLA da esteira", "Dias entre a candidatura e a contratação. Meta: 45 dias.", "mediana das contratadas entre as aplicações do período."),
    ("SLA da etapa", "Dias entre a entrada e a saída da etapa, contados em dias inteiros.", "só etapas concluídas; 0,0 d = resolvida no mesmo dia (comum em etapas automáticas)."),
    ("Média x mediana", "A mediana é o caso típico. Média bem acima da mediana indica poucos casos muito demorados.", "compare as duas antes de concluir que uma etapa é lenta."),
    ("P90", "Tempo em que 90% das aplicações já saíram da etapa.", "acima do P90 = caso fora do padrão."),
    ("Mês atual x anterior", "Compara o mês corrente até hoje com os mesmos dias do mês anterior.", "ex.: 01 a 19/10 contra 01 a 19/09."),
    ("YTD", "Acumulado do ano até hoje.", "começa em 01/07/2026, início dos dados."),
])

depara()

faq([
    ("Conversão baixa, SLA curto e muitas aplicações por contratação em um período recente. Está errado?",
     "Não. Pela data de candidatura, aplicações recentes ainda não terminaram o processo: só as contratações rápidas já aconteceram. Para leitura gerencial, use períodos com mais de 45 dias ou já fechados."),
    ("O card de entrevistas do Resumo é maior que o da Nominal.",
     "O Resumo conta entrevistas; a Nominal (por enquanto) conta aplicações com entrevista. Uma pessoa com 3 entrevistas é 3 no Resumo e 1 na Nominal."),
    ("Entrevistas marcadas é diferente de entrevistas na agenda.",
     "São perguntas diferentes: marcadas usa o dia em que o time agendou; na agenda, o dia em que a entrevista acontece. Uma entrevista marcada em setembro para outubro conta em meses diferentes."),
    ("O gráfico de Evolução mostra números maiores que os cards.",
     "A Evolução conta movimentações: cada aprovação ou rejeição em cada etapa, pela data em que aconteceu. Os cards contam aplicações do período."),
    ("A primeira etapa da tabela tem menos aplicações que o card Aplicações.",
     "Nem toda aplicação passa pela primeira etapa: algumas começam em outra etapa e outras ainda não têm entrada registrada no Greenhouse."),
    ("A soma dos recrutadores é menor que o total.",
     "Aplicações de vagas sem recrutador cadastrado entram no total, mas não em nenhum recrutador. Para ver a lista: Nominal com o filtro Recrutador = (Em branco)."),
    ("“Rejeitados” no Report é maior que “Rejeitadas” na Nominal.",
     "No Report, rejeitados = rejeitadas pela XP + declinaram a offer. Na Nominal, são dois cards: some os dois."),
    ("SLA mediano de 0,0 dia em algumas etapas.",
     "O tempo é contado em dias inteiros. Etapas resolvidas no mesmo dia (triagens e etapas automáticas) ficam com 0."),
    ("“Paradas há mais de 45 dias” aparece zerado.",
     "Com um período menor que 45 dias, nenhuma aplicação do período tem 45 dias de processo ainda."),
    ("Uma contratação de julho não aparece.",
     "Os dados começam em 01/07/2026: quem se candidatou antes disso não entra, mesmo contratado depois."),
    ("Uma pessoa aparece como indicação em uma vaga para a qual não foi indicada.",
     "A 2ª regra de indicação (Referred By) é do candidato, não da aplicação: vale para todas as aplicações da pessoa."),
    ("Algumas aplicações aparecem como “(Sem organograma)” no filtro de N.",
     "A vaga dessas aplicações não tem cadeira cadastrada na Gestão de Estruturas. Elas contam no total, mas somem quando um N é escolhido. É uma lacuna conhecida do cadastro."),
    ("A lista da Nominal tem mais linhas que o card “Todas”.",
     "A lista também traz aplicações de antes do período que têm entrevista no período (base de entrevistas). “Todas” conta só as do período."),
])

section("Limitações conhecidas", "Leia antes de tirar conclusões.", [
    ("Histórico curto", "Só há dados a partir de julho de 2026: comparações com períodos anteriores ainda não são possíveis.", ""),
    ("Entrevistas fora do Greenhouse", "Entrevistas marcadas por fora do Greenhouse não aparecem na agenda nem na conversão de entrevista.", ""),
    ("Mês corrente parcial", "O mês atual é comparado com os mesmos dias do mês anterior, não com o mês inteiro.", ""),
    ("Baixa no Greenhouse", "Candidatos sem baixa no Greenhouse continuam “em andamento” e podem aparecer como parados.", ""),
], bg="#FFFBF3")

L.append(text(292, y + 10, "Dúvidas sobre os conceitos: time de People Analytics.", 13, 400, "#6B6B6B"))
H = int(y + 60)

# ---------------- montagem ----------------
src = open(SRC, encoding="utf-8").read().split("\n")
start = next(i for i, l in enumerate(src) if "O que é a visão de Esteiras" in l)
end = next(i for i, l in enumerate(src) if l.strip() == "</g>" and i > start)
head, tail = src[:start], src[end:]
OLD = 3159
def fix(l):
    l = l.replace(f'height="{OLD}"', f'height="{H}"').replace(f'viewBox="0 0 1900 {OLD}"', f'viewBox="0 0 1900 {H}"')
    l = l.replace("translate(0 1659)", f"translate(0 {1659 + H - OLD})")
    l = l.replace("Conceitos: como ler o dashboard e o que cada número significa", "Conceitos: a regra dos números, o dicionário e as justificativas")
    return l
head = [fix(l) for l in head]; tail = [fix(l) for l in tail]
open(DST, "w", encoding="utf-8").write("\n".join(head + L + tail))
print("altura", H)
