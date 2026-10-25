"""Gera os mockups da etapa 6 (páginas Dados do dash e Alertas) sobre o fundo real da Nominal."""
import pathlib

BG = "../../backgrounds/BG - Esteiras_Nominal.svg"
OUT = pathlib.Path(__file__).resolve().parent.parent / "docs" / "mockups"

CSS = """
*{box-sizing:border-box}body{margin:0;font-family:"Segoe UI",Inter,Arial,sans-serif;color:#121212}
.pg{position:relative;width:1900px;height:HEIGHTpx;overflow:hidden;background:#F0F0F0}
.bg{position:absolute;left:0;top:0;width:1900px}
.abs{position:absolute}
.sub{left:298px;top:88px;width:900px;height:26px;background:#fff;font-size:19px;color:#333}
.slc{display:flex;gap:10px;left:318px;top:200px;width:1530px}
.sl{border:1px solid #DDE2E3;border-radius:8px;background:#fff;padding:5px 10px;flex:1;min-width:0;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#555}
.sl small{display:block;font-size:10px;font-weight:700;letter-spacing:.04em;color:#333}
.sl.on{border:1.5px solid #067D84;background:#F3FAFA;color:#121212}.sl.on small{color:#067D84}
.act{left:318px;top:290px;display:flex;gap:8px;align-items:center;font-size:12.5px}
.act .t{color:#6B6B6B;margin-right:4px}
.ch{background:#E3F1F0;color:#03474C;border-radius:14px;padding:4px 10px}.ch b{font-weight:600}.ch i{font-style:normal;margin-left:6px;color:#067D84}
.clr{color:#067D84;text-decoration:underline;margin-left:6px}
.main{left:292px;top:362px;width:1588px}
.pad{padding:22px 26px}
h2{margin:0;font-size:20px}.h2s{color:#6B6B6B;font-size:13px;margin-top:4px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;color:#6B6B6B;font-weight:600;border-bottom:1px solid #DDE2E3;padding:8px;font-size:12px;white-space:nowrap}
td{padding:8px;border-bottom:1px solid #F0F2F2;vertical-align:top}
td a{color:#067D84;text-decoration:none;font-weight:600}
.pill{border-radius:10px;padding:2px 8px;font-size:11.5px;white-space:nowrap}
.pr{background:#FBE3E1;color:#B23A31}.pd{background:#FBF0DC;color:#9A6512}.pa{background:#E3F1F0;color:#03474C}.pg2{background:#EEF0F0;color:#555}
.al{display:inline-block;background:#FBF0DC;color:#9A6512;border-radius:6px;padding:1px 6px;font-size:11px;margin:0 3px 2px 0;white-space:nowrap}
.ad{background:#EEF0F0;color:#555}
.sel{background:#F7FBFB}.tl{background:#F7FBFB;padding:10px 14px;font-size:12px;color:#6B6B6B}
.st{display:inline-block;margin-right:16px}.st b{color:#121212}.st.vt b{color:#9A6512}.st.rj b{color:#B23A31}.st.off{color:#A9B4B6}
.bar{display:flex;gap:10px;align-items:center;margin:12px 0}
.search{flex:1;border:1px solid #DDE2E3;border-radius:8px;padding:8px 10px;color:#A9B4B6;font-size:13px}
.btn{border:1px solid #067D84;color:#067D84;border-radius:8px;padding:7px 12px;font-size:13px;background:#fff;white-space:nowrap}
.tg{border:1px solid #E3A33B;background:#FBF0DC;color:#9A6512;border-radius:8px;padding:7px 12px;font-size:13px;white-space:nowrap}
.foot{font-size:11.5px;color:#6B6B6B;margin-top:10px}
.ok{color:#0A6B5A;font-size:13px;font-weight:600}
.big{display:flex;align-items:baseline;gap:12px}.big .n{font-size:34px;font-weight:700}
.seg{display:flex;gap:6px;font-size:13px;flex-wrap:wrap}
.s{border:1px solid #DDE2E3;border-radius:16px;padding:5px 12px;background:#fff}.s b{margin-left:4px}.s.on{background:#067D84;border-color:#067D84;color:#fff}
.lab{position:absolute;left:30px;font-size:14px;font-weight:700;color:#fff;background:#B8433A;border-radius:8px;padding:6px 12px}
"""

FILTROS = """
<div class="abs sub">Dados do dash: as aplicações por trás de cada número</div>
<div class="abs slc">
 <div class="sl on"><small>PERÍODO</small>T3 2026</div>
 <div class="sl"><small>ORGANOGRAMA (N)</small>Todos</div>
 <div class="sl"><small>ESTEIRA</small>Todas</div>
 <div class="sl"><small>BK</small>Todos</div>
 <div class="sl"><small>RECRUTADOR</small>Todos</div>
 <div class="sl"><small>SOURCER</small>Todos</div>
 <div class="sl"><small>PERSONA</small>Todas</div>
 <div class="sl on"><small>ESPECIALIDADE</small>Assessoria B2C</div>
 <div class="sl on"><small>ETAPA</small>Phone Screening</div>
 <div class="sl"><small>PRAÇA</small>Todas</div>
</div>
<div class="abs act"><span class="t">Filtros ativos (3):</span>
 <span class="ch">Período: <b>01/07 – 30/09/2026</b><i>×</i></span>
 <span class="ch">Especialidade: <b>Assessoria B2C</b><i>×</i></span>
 <span class="ch">Etapa: <b>Phone Screening</b><i>×</i></span>
 <span class="ch" style="background:#fff;border:1px dashed #067D84">Indicação: <b>Todas</b></span>
 <span class="clr">Limpar filtros</span>
</div>
"""

COLS = "<tr><th>Greenhouse</th><th>Candidato</th><th>Vaga</th><th>Esteira</th><th>Recrutador</th><th>Etapa da rejeição</th><th>Motivo</th><th>Tipo</th><th>Candidatura</th><th>Entrada</th><th>Saída</th><th>Dias na etapa</th><th>Alertas</th></tr>"
ROWS = """
<tr class="sel"><td><a>Abrir ↗</a></td><td>Ana Souza</td><td>[Pool B2C] Assessoria · SP</td><td>B2C - XP Future</td><td>Marina L.</td><td>Phone Screening</td><td>[Avaliação] Sem qualificação técnica</td><td><span class="pill pr">Avaliação</span></td><td>02/07</td><td>14/07</td><td>21/07</td><td>7</td><td><span class="al">Voltou de etapa (1×)</span></td></tr>
<tr><td colspan="13" class="tl"><span class="st"><b>Revisão de aplicação</b> 02/07 → 02/07 · 0 d</span><span class="st"><b>Entrevista Inteligente</b> 02/07 → 14/07 · 12 d</span><span class="st vt"><b>Ranking Score</b> 14/07 → 14/07 · 0 d · voltou</span><span class="st rj"><b>Phone Screening</b> 14/07 → 21/07 · 7 d · rejeitada</span><span class="st off">Entrevista com supervisor · não chegou</span><span class="st off">Offer · não chegou</span><span class="st">Total: <b>19 dias</b></span></td></tr>
<tr><td><a>Abrir ↗</a></td><td>Bruno Lima</td><td>[Pool B2C] Assessoria · RJ</td><td>(Sem esteira)</td><td>Pedro A.</td><td>Phone Screening</td><td>[Geral] Desistência no meio do processo</td><td><span class="pill pd">Desistência</span></td><td>05/07</td><td>09/07</td><td>30/07</td><td>21</td><td></td></tr>
<tr><td><a>Abrir ↗</a></td><td>Carla Nunes</td><td>[Pool B2C] Assessoria · ABC</td><td>(Sem esteira)</td><td>Elisa G.</td><td>Phone Screening</td><td>[Geral] Limpeza de Pool</td><td><span class="pill pg2">Administrativo</span></td><td>11/07</td><td>12/07</td><td>04/09</td><td>54</td><td><span class="al">Etapa de configuração</span></td></tr>
<tr><td><a>Abrir ↗</a></td><td>Diego Reis</td><td>Assessoria Future · BH</td><td>B2C - XP Future</td><td>Marina L.</td><td>Phone Screening</td><td>—</td><td><span class="pill pg2">Sem motivo</span></td><td>18/08</td><td>20/08</td><td>21/08</td><td>1</td><td><span class="al ad">Rejeitada sem motivo</span><span class="al ad">Etapas em dobro</span></td></tr>
<tr><td><a>Abrir ↗</a></td><td>Elisa Prado</td><td>[Pool B2C] Assessoria · SP</td><td>(Sem esteira)</td><td>Laura F.</td><td>Phone Screening</td><td>[Aplicação] Anywhere - Fora de SP</td><td><span class="pill pr">Avaliação</span></td><td>03/09</td><td>04/09</td><td>04/09</td><td>0</td><td></td></tr>
"""
TABELA = f"""
<div class="bar"><div class="search">Buscar candidato, vaga, recrutador, motivo…</div><span class="tg">⚠ Só exceções (37)</span><div class="btn">Colunas ▾</div><div class="btn">⤓ Exportar CSV</div></div>
<table>{COLS}{ROWS}</table>
<div class="foot">Mostrando 50 de 312 · clique numa linha para ver a linha do tempo · busca e CSV valem para a lista inteira · nomes fictícios</div>
"""
TOPO = """<div class="big"><span class="n">312</span><span style="font-size:15px">aplicações encerradas no Phone Screening</span><span class="ok">✓ igual ao gráfico "Motivos de saída por etapa"</span></div>"""
SEGS = """<div class="seg" style="margin-top:12px"><span class="s on">Todas <b>312</b></span><span class="s">Avaliação <b>251</b></span><span class="s">Desistência <b>18</b></span><span class="s">Declínio <b>0</b></span><span class="s">Administrativo <b>29</b></span><span class="s">Sem motivo <b>14</b></span></div>"""

def page(name, height, body, label):
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS.replace('HEIGHT', str(height))}</style></head>
<body><div class="pg"><img class="bg" src="{BG}">{FILTROS}{body}<div class="lab" style="top:{height-60}px">{label}</div></div></body></html>"""
    (OUT / f"{name}.html").write_text(html, encoding="utf-8")

# ---------- Versão A: visões como abas com ícone e número, agrupadas (Resumo | Report) ----------
VA = """
<style>.vt{display:flex;gap:10px;flex-wrap:wrap}.grp{font-size:11px;font-weight:700;letter-spacing:.05em;color:#6B6B6B;margin:0 0 8px}
.vc{border:1px solid #DDE2E3;border-radius:12px;padding:10px 14px;min-width:168px;background:#fff}
.vc .i{font-size:16px}.vc .n{font-size:20px;font-weight:700;margin-top:2px}.vc .l{font-size:12.5px;color:#444}
.vc.on{border:2px solid #067D84;background:#E3F1F0}.vc.on .n{color:#03474C}
.two{display:grid;grid-template-columns:auto 1fr;gap:28px}</style>
<div class="abs main"><div class="pad">
<h2>O que você quer conferir?</h2><div class="h2s">Escolha o número do dash · a lista abaixo mostra as aplicações por trás dele, com os filtros acima</div>
<div class="two" style="margin-top:16px">
 <div><div class="grp">RESUMO</div><div class="vt">
  <div class="vc"><div class="i">👥</div><div class="n">2.410</div><div class="l">Aplicações</div></div>
  <div class="vc"><div class="i">✔</div><div class="n">31</div><div class="l">Contratadas</div></div>
  <div class="vc"><div class="i">⏳</div><div class="n">902</div><div class="l">Em andamento</div></div></div></div>
 <div><div class="grp">REPORT</div><div class="vt">
  <div class="vc"><div class="i">⇄</div><div class="n">1.488</div><div class="l">Entradas por etapa</div></div>
  <div class="vc on"><div class="i">✕</div><div class="n">312</div><div class="l">Rejeitados e motivos</div></div>
  <div class="vc"><div class="i">▦</div><div class="n">902</div><div class="l">Andamento por faixa</div></div>
  <div class="vc"><div class="i">⏱</div><div class="n">1.977</div><div class="l">SLA por etapa (passagens)</div></div>
  <div class="vc"><div class="i">🗓</div><div class="n">644</div><div class="l">Entrevistas</div></div></div></div>
</div>
<div style="border-top:1px solid #ECECEC;margin:18px 0 14px"></div>
""" + TOPO + SEGS + TABELA + "</div></div>"
page("34-dados-versao-A", 1420, VA, "Versão A · visões como cartões (número de cada uma visível)")

# ---------- Versão B: menu lateral dentro do cartão, com ícones e descrição ----------
VB = """
<style>.lay{display:grid;grid-template-columns:270px 1fr}.rail{border-right:1px solid #ECECEC;padding:22px 14px}
.rg{font-size:11px;font-weight:700;letter-spacing:.05em;color:#6B6B6B;margin:14px 8px 6px}.rg:first-child{margin-top:0}
.ri{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:6px;padding:9px 10px;border-radius:10px;font-size:13.5px}
.ri .ic{width:26px;height:26px;border-radius:8px;background:#E3F1F0;color:#067D84;display:flex;align-items:center;justify-content:center;font-size:13px}
.ri .c{font-size:12px;color:#6B6B6B}.ri.on{background:#067D84;color:#fff}.ri.on .ic{background:#fff}.ri.on .c{color:#E3F1F0}
.ri small{display:block;font-size:11px;color:#8A8A8A}.ri.on small{color:#CDE9E7}</style>
<div class="abs main"><div class="lay">
<div class="rail">
 <div class="rg">RESUMO</div>
 <div class="ri"><span class="ic">👥</span><span>Aplicações<small>todas do período</small></span><span class="c">2.410</span></div>
 <div class="ri"><span class="ic">✔</span><span>Contratadas<small>origem e SLA</small></span><span class="c">31</span></div>
 <div class="ri"><span class="ic">⏳</span><span>Em andamento<small>etapa atual e dias</small></span><span class="c">902</span></div>
 <div class="ri"><span class="ic">▽</span><span>Funil<small>até onde chegou</small></span><span class="c">2.410</span></div>
 <div class="rg">REPORT</div>
 <div class="ri"><span class="ic">⇄</span><span>Entradas por etapa<small>aprovou, rejeitou, voltou</small></span><span class="c">1.488</span></div>
 <div class="ri on"><span class="ic">✕</span><span>Rejeitados e motivos<small>etapa e motivo</small></span><span class="c">312</span></div>
 <div class="ri"><span class="ic">▦</span><span>Andamento por faixa<small>dias parado</small></span><span class="c">902</span></div>
 <div class="ri"><span class="ic">⏱</span><span>SLA por etapa<small>entrada → saída</small></span><span class="c">1.977</span></div>
 <div class="ri"><span class="ic">👤</span><span>Por recrutador<small>situação</small></span><span class="c">2.410</span></div>
 <div class="ri"><span class="ic">📈</span><span>Evolução<small>movimentações</small></span><span class="c">3.105</span></div>
 <div class="ri"><span class="ic">🗓</span><span>Entrevistas<small>1 linha por entrevista</small></span><span class="c">644</span></div>
 <div class="rg">QUALIDADE</div>
 <div class="ri"><span class="ic">⚠</span><span>Alertas<small>página própria</small></span><span class="c">→</span></div>
</div>
<div class="pad">""" + TOPO + SEGS + TABELA + "</div></div></div>"
page("34-dados-versao-B", 1420, VB, "Versão B · menu lateral com ícone, descrição e contagem")

# ---------- Versão C: seletor compacto + cartões de segmento no padrão dos big numbers ----------
VC = """
<style>.sel2{display:flex;align-items:center;gap:14px}
.dd{border:1.5px solid #067D84;border-radius:10px;padding:8px 14px;font-size:15px;background:#F3FAFA;min-width:420px}
.dd small{display:block;font-size:10.5px;font-weight:700;color:#067D84;letter-spacing:.04em}
.kp{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin:16px 0 4px}
.k{border:1px solid #ECECEC;border-radius:14px;padding:12px 14px}.k .l{font-size:11.5px;font-weight:700;color:#555;letter-spacing:.04em}
.k .n{font-size:28px;font-weight:700;margin:2px 0}.k .c{font-size:12px;color:#6B6B6B}
.k.on{border:2px solid #067D84;background:#F3FAFA}
.menu{position:absolute;left:26px;top:96px;width:420px;background:#fff;border:1px solid #DDE2E3;border-radius:10px;box-shadow:0 6px 18px #0002;padding:8px;font-size:13px;z-index:3}
.menu .g{font-size:10.5px;font-weight:700;color:#6B6B6B;margin:6px 8px}.menu .o{padding:7px 8px;border-radius:6px;display:flex;justify-content:space-between}
.menu .o span{color:#6B6B6B}.menu .o.on{background:#E3F1F0;color:#03474C;font-weight:600}</style>
<div class="abs main"><div class="pad" style="position:relative">
<div class="sel2"><div class="dd"><small>CONFERIR O NÚMERO DE</small>Rejeitados e motivos ▾</div><span class="ok">✓ 312 aplicações · igual ao gráfico "Motivos de saída por etapa"</span><span class="btn" style="margin-left:auto">← Voltar ao gráfico</span></div>
<div class="kp">
 <div class="k on"><div class="l">TODAS</div><div class="n">312</div><div class="c">rejeitadas no Phone Screening</div></div>
 <div class="k"><div class="l">AVALIAÇÃO</div><div class="n" style="color:#B8433A">251</div><div class="c">80% · decisão da XP</div></div>
 <div class="k"><div class="l">DESISTÊNCIA</div><div class="n" style="color:#9A6512">18</div><div class="c">6% · decisão do candidato</div></div>
 <div class="k"><div class="l">DECLÍNIO</div><div class="n">0</div><div class="c">recusou a offer</div></div>
 <div class="k"><div class="l">ADMINISTRATIVO</div><div class="n" style="color:#555">29</div><div class="c">9% · limpeza, posição cancelada</div></div>
 <div class="k"><div class="l">SEM MOTIVO</div><div class="n" style="color:#555">14</div><div class="c">5% · motivo não chegou na base</div></div>
</div>
<div class="menu"><div class="g">RESUMO</div><div class="o">Aplicações <span>2.410</span></div><div class="o">Contratadas <span>31</span></div><div class="o">Em andamento <span>902</span></div><div class="o">Funil <span>2.410</span></div>
<div class="g">REPORT</div><div class="o">Entradas por etapa <span>1.488</span></div><div class="o on">Rejeitados e motivos <span>312</span></div><div class="o">Andamento por faixa <span>902</span></div><div class="o">SLA por etapa <span>1.977</span></div><div class="o">Por recrutador <span>2.410</span></div><div class="o">Evolução <span>3.105</span></div><div class="o">Entrevistas <span>644</span></div></div>
""" + TABELA + "</div></div>"
page("34-dados-versao-C", 1380, VC, "Versão C · seletor compacto (aberto) + segmentos como big numbers")

# ---------- Alertas v2 ----------
AL = """
<style>.kc{position:absolute;top:380px;width:368px;height:180px;background:#fff;border:1px solid #E6E6E6;border-radius:22px;padding:20px 22px}
.kc .l{font-size:13px;font-weight:700;letter-spacing:.05em;color:#555}.kc .n{font-size:44px;font-weight:700;margin:6px 0 2px}
.kc .c{font-size:15px;color:#555}.kc .bt{border-top:1px solid #ECECEC;margin-top:12px;padding-top:10px;font-size:13px;color:#6B6B6B}
.kc .pp{float:right;background:#E3F1F0;color:#067D84;border-radius:12px;padding:3px 10px;font-size:13px;font-weight:400;letter-spacing:0}
.box{position:absolute;background:#fff;border:1px solid #E6E6E6;border-radius:22px;padding:22px 26px}
.it{display:grid;grid-template-columns:20px 230px 1fr 70px 56px;gap:10px;align-items:center;font-size:13.5px;padding:6px 0}
.ii{width:17px;height:17px;border-radius:50%;border:1px solid #067D84;color:#067D84;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:700}
.it .b{height:12px;border-radius:6px}.it .v{text-align:right;font-weight:600}.it .p{text-align:right;color:#6B6B6B;font-size:12px}
.proc{background:#E3A33B}.dado{background:#8FA3A6}.gr{font-size:11px;font-weight:700;letter-spacing:.05em;color:#6B6B6B;margin:12px 0 4px}
.tip{position:absolute;left:300px;top:150px;width:420px;background:#121212;color:#fff;border-radius:10px;padding:12px 14px;font-size:12.5px;line-height:1.5;box-shadow:0 6px 18px #0003}
.tip b{color:#7FD3D0}
.r{display:grid;grid-template-columns:150px 1fr 70px;gap:10px;align-items:center;padding:5px 0;font-size:13px}.r .b{height:12px;border-radius:6px;background:#E3A33B}
</style>
<div class="kc" style="left:310px"><div class="l">COM ALGUM ALERTA <span class="pp">desde 01/jul</span></div><div class="n">16.867</div><div class="c">14% das 122.394 aplicações</div><div class="bt">Processo 10.971 ocorrências · Dado 8.050</div></div>
<div class="kc" style="left:698px"><div class="l">VOLTOU DE ETAPA <span class="pp">desde 01/jul</span></div><div class="n" style="color:#9A6512">8.023</div><div class="c">6,6% das aplicações</div><div class="bt">maior volume: Mindsight → Revisão</div></div>
<div class="kc" style="left:1086px"><div class="l">SEM MOTIVO NA BASE <span class="pp">desde 01/jul</span></div><div class="n" style="color:#555">4.162</div><div class="c">rejeitadas sem motivo</div><div class="bt">provável "Duplicate" do Greenhouse</div></div>
<div class="kc" style="left:1474px;width:388px"><div class="l">CONTRATADA NO POOL <span class="pp">desde 01/jul</span></div><div class="n" style="color:#B8433A">1</div><div class="c">não deveria acontecer</div><div class="bt">o fluxo certo é sair do pool para uma vaga</div></div>
<div class="box" style="left:310px;top:580px;width:770px;height:420px"><h2>Tipos de alerta</h2><div class="h2s">passe o mouse no ⓘ para ver o que significa · clique para filtrar a lista</div>
<div class="gr">PROCESSO · CORRIGIR NO GREENHOUSE (ÁREAS E RECRUTADORES)</div>
<div class="it"><span class="ii">i</span><span>Contratada dentro do pool</span><span class="b proc" style="width:1%"></span><span class="v">1</span><span class="p">0,0%</span></div>
<div class="it" style="background:#F7FBFB;border-radius:8px"><span class="ii">i</span><span>Voltou de etapa</span><span class="b proc" style="width:100%"></span><span class="v">8.023</span><span class="p">6,6%</span></div>
<div class="it"><span class="ii">i</span><span>Etapa de configuração</span><span class="b proc" style="width:37%"></span><span class="v">2.947</span><span class="p">2,4%</span></div>
<div class="gr">DADO · TABELA DE ETAPAS (ENGENHARIA)</div>
<div class="it"><span class="ii">i</span><span>Rejeitada sem motivo</span><span class="b dado" style="width:52%"></span><span class="v">4.162</span><span class="p">3,4%</span></div>
<div class="it"><span class="ii">i</span><span>Etapas em dobro na origem</span><span class="b dado" style="width:41%"></span><span class="v">3.280</span><span class="p">2,7%</span></div>
<div class="it"><span class="ii">i</span><span>Etapa sem nome</span><span class="b dado" style="width:7%"></span><span class="v">561</span><span class="p">0,5%</span></div>
<div class="it"><span class="ii">i</span><span>Etapa antes da candidatura</span><span class="b dado" style="width:1%"></span><span class="v">47</span><span class="p">0,0%</span></div>
<div class="tip" style="left:60px;top:200px"><b>Voltou de etapa</b><br>A aplicação foi movida para uma etapa anterior (ex.: Phone Screening → Triagem). O tempo conta no SLA, mas a etapa de onde ela voltou não conta como aprovação. Muitas vezes é um clique errado corrigido na hora.<br><b>Onde corrigir:</b> no Greenhouse, pelo recrutador.</div>
</div>
<div class="box" style="left:1094px;top:580px;width:768px;height:420px"><h2>Onde acontece: "Voltou de etapa"</h2><div class="h2s">por <u>recrutador</u> · etapa · vaga · esteira · % sobre as aplicações de cada um</div>
<div style="margin-top:14px">
<div class="r"><span>Marina L.</span><span class="b" style="width:88%"></span><span>412 · 9%</span></div>
<div class="r"><span>Pedro A.</span><span class="b" style="width:64%"></span><span>301 · 7%</span></div>
<div class="r"><span>Laura F.</span><span class="b" style="width:51%"></span><span>240 · 5%</span></div>
<div class="r"><span>Elisa G.</span><span class="b" style="width:33%"></span><span>156 · 4%</span></div>
<div class="r"><span>Rafael C.</span><span class="b" style="width:20%"></span><span>94 · 3%</span></div>
<div class="r"><span>(sem recrutador)</span><span class="b" style="width:15%"></span><span>71 · 1%</span></div></div></div>
<div class="box" style="left:310px;top:1018px;width:1552px;height:330px">
<div class="bar" style="margin-top:0"><span class="pill pa" style="padding:6px 12px;font-size:12.5px">Filtro: Voltou de etapa ×</span><div class="search">Buscar candidato, vaga, recrutador…</div><div class="btn">⤓ Exportar CSV</div></div>
<table><tr><th>Greenhouse</th><th>Candidato</th><th>Vaga</th><th>Esteira</th><th>Especialidade</th><th>Recrutador</th><th>Situação</th><th>Etapa atual</th><th>Candidatura</th><th>Dias no processo</th><th>Alertas</th></tr>
<tr><td><a>Abrir ↗</a></td><td>Ana Souza</td><td>[Pool B2C] Assessoria · SP</td><td>(Sem esteira)</td><td>Assessoria B2C</td><td>Marina L.</td><td>Rejeitada</td><td>Phone Screening</td><td>02/07</td><td>19</td><td><span class="al">Voltou de etapa (1×)</span></td></tr>
<tr><td><a>Abrir ↗</a></td><td>Gustavo Melo</td><td>[2026] Pool Eng. Back-end</td><td>(Sem esteira)</td><td>Eng. de Software</td><td>Pedro A.</td><td>Rejeitada</td><td>Phone Screening</td><td>18/10</td><td>4</td><td><span class="al">Voltou de etapa (1×)</span><span class="al">Etapa de configuração</span></td></tr>
<tr><td><a>Abrir ↗</a></td><td>Helena Dias</td><td>Analista de Seg. Info Sr.</td><td>Tecnologia - Segurança</td><td>Segurança da Informação</td><td>Laura F.</td><td>Rejeitada</td><td>Triagem</td><td>30/06</td><td>78</td><td><span class="al">Voltou de etapa (1×)</span></td></tr>
<tr><td><a>Abrir ↗</a></td><td>Igor Santos</td><td>Group Product Manager</td><td>Produto</td><td>Product</td><td>Elisa G.</td><td>Em andamento</td><td>Revisão de aplicação</td><td>01/07</td><td>116</td><td><span class="al">Voltou de etapa (2×)</span><span class="al ad">Etapas em dobro</span></td></tr></table>
<div class="foot">Mostrando 50 de 8.023 · contagens por tipo são reais (25/10/2026); recrutadores, nomes e esteiras são fictícios</div></div>
"""
html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS.replace('HEIGHT','1440')}</style></head>
<body><div class="pg"><img class="bg" src="{BG}">{FILTROS.replace('Dados do dash: as aplicações por trás de cada número','Alertas: qualidade do processo e dos dados')}{AL}<div class="lab" style="top:1380px">Alertas v2 · cards no padrão do dash, ⓘ em cada alerta, tabela com mais colunas</div></div></body></html>"""
(OUT / "35-alertas-v2.html").write_text(html, encoding="utf-8")
