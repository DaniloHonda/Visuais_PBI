"""Mockup da página Data Quality (6.6) sobre o fundo real, no padrão da tabela nominal 2.0."""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from gen_mockups_dados import CSS, FILTROS, OUT  # noqa: E402

BG = "../../backgrounds/BG - Esteiras_DataQuality.svg"
SUB = "Data quality: alertas de processo e de dado por trás dos números"

EXTRA = """
.kc{position:absolute;top:380px;width:368px;height:180px;background:#fff;border:1px solid #E6E6E6;border-radius:22px;padding:20px 22px}
.kc .l{font-size:13px;font-weight:700;letter-spacing:.05em;color:#555;display:flex;align-items:center;gap:6px}
.kc .n{font-size:44px;font-weight:700;margin:6px 0 2px}
.kc .c{font-size:15px;color:#555}.kc .bt{border-top:1px solid #ECECEC;margin-top:12px;padding-top:10px;font-size:13px;color:#6B6B6B}
.kc .pp{margin-left:auto;background:#E3F1F0;color:#067D84;border-radius:12px;padding:3px 10px;font-size:13px;font-weight:400;letter-spacing:0}
.box{position:absolute;background:#fff;border:1px solid #E6E6E6;border-radius:22px;padding:22px 26px}
.ii{width:17px;height:17px;border-radius:50%;border:1px solid #067D84;color:#067D84;font-size:11px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;flex:none}
.it{display:grid;grid-template-columns:20px 230px 1fr 70px 56px;gap:10px;align-items:center;font-size:13.5px;padding:6px 8px;border-radius:8px}
.it .b{height:12px;border-radius:6px}.it .v{text-align:right;font-weight:600}.it .p{text-align:right;color:#6B6B6B;font-size:12px}
.it.on{background:#E3F1F0;box-shadow:inset 3px 0 0 #067D84}
.proc{background:#E3A33B}.dado{background:#8FA3A6}.gr{font-size:11px;font-weight:700;letter-spacing:.05em;color:#6B6B6B;margin:12px 0 4px}
.tip{position:absolute;width:420px;background:#121212;color:#fff;border-radius:10px;padding:12px 14px;font-size:12.5px;line-height:1.5;box-shadow:0 6px 18px #0003;z-index:5}
.tip b{color:#7FD3D0}
.sg{display:inline-flex;border:1px solid #067D84;border-radius:10px;overflow:hidden;margin-top:12px}
.sg span{padding:7px 16px;font-size:13px;color:#067D84;border-right:1px solid #067D84;background:#fff}
.sg span:last-child{border-right:0}.sg span.on{background:#067D84;color:#fff;font-weight:600}
.r{display:grid;grid-template-columns:190px 1fr 110px;gap:10px;align-items:center;padding:5px 0;font-size:13px}
.r .b{height:12px;border-radius:6px;background:#E3A33B}.r .x{text-align:right;color:#444}
.t2top{display:flex;align-items:baseline;gap:12px}.t2top .n{font-size:34px;font-weight:700}
.dd{display:inline-block;min-width:40px;text-align:center;padding:1px 8px;border-radius:999px;font-size:12px}
.dok{background:#F2F4F4;color:#3C3C3C}.dwa{background:#FFF1D6;color:#7A4B00}.dba{background:#FBE7E5;color:#A33A31}
.note{position:absolute;font-size:12px;color:#fff;background:#03474C;border-radius:8px;padding:6px 10px;z-index:6}
"""

BODY = """
<div class="kc" style="left:310px"><div class="l">COM ALGUM ALERTA <span class="ii">i</span><span class="pp">no período</span></div><div class="n">16.867</div><div class="c">14% das 122.394 aplicações</div><div class="bt">Processo 10.971 · Dado 8.050 (uma aplicação pode ter os dois)</div></div>
<div class="kc" style="left:698px"><div class="l">VOLTOU DE ETAPA <span class="ii">i</span><span class="pp">no período</span></div><div class="n" style="color:#9A6512">8.023</div><div class="c">6,6% das aplicações</div><div class="bt">onde mais acontece: Phone Screening</div></div>
<div class="kc" style="left:1086px"><div class="l">SEM MOTIVO NA BASE <span class="ii">i</span><span class="pp">no período</span></div><div class="n" style="color:#555">4.162</div><div class="c">rejeitadas sem motivo</div><div class="bt">provável "Duplicate" do Greenhouse</div></div>
<div class="kc" style="left:1474px;width:388px"><div class="l">CONTRATADA NO POOL <span class="ii">i</span><span class="pp">no período</span></div><div class="n" style="color:#B8433A">1</div><div class="c">não deveria acontecer</div><div class="bt">o fluxo certo é sair do pool para uma vaga</div></div>

<div class="box" style="left:310px;top:580px;width:770px;height:430px"><h2>Tipos de alerta</h2><div class="h2s">passe o mouse no ⓘ para ver o que significa · clique para filtrar o gráfico ao lado e a lista</div>
<div class="gr">PROCESSO · CORRIGIR NO GREENHOUSE (ÁREAS E RECRUTADORES)</div>
<div class="it"><span class="ii">i</span><span>Contratada dentro do pool</span><span class="b proc" style="width:1%"></span><span class="v">1</span><span class="p">0,0%</span></div>
<div class="it on"><span class="ii">i</span><span><b>Voltou de etapa</b></span><span class="b proc" style="width:100%"></span><span class="v">8.023</span><span class="p">6,6%</span></div>
<div class="it"><span class="ii">i</span><span>Etapa de configuração</span><span class="b proc" style="width:37%"></span><span class="v">2.947</span><span class="p">2,4%</span></div>
<div class="gr">DADO · TABELA DE ETAPAS (ENGENHARIA)</div>
<div class="it"><span class="ii">i</span><span>Rejeitada sem motivo</span><span class="b dado" style="width:52%"></span><span class="v">4.162</span><span class="p">3,4%</span></div>
<div class="it"><span class="ii">i</span><span>Etapas em dobro na origem</span><span class="b dado" style="width:41%"></span><span class="v">3.280</span><span class="p">2,7%</span></div>
<div class="it"><span class="ii">i</span><span>Etapa sem nome</span><span class="b dado" style="width:7%"></span><span class="v">561</span><span class="p">0,5%</span></div>
<div class="it"><span class="ii">i</span><span>Etapa antes da candidatura</span><span class="b dado" style="width:1%"></span><span class="v">47</span><span class="p">0,0%</span></div>
<div class="tip" style="left:300px;top:96px"><b>Etapa de configuração</b><br>A aplicação passou por uma etapa que serve para organizar a vaga (Senior, Pleno, Pool Qualificados, Stand-by | Silver medalist). O tempo conta no SLA e na meta.<br><b>Onde corrigir:</b> no Greenhouse, revisando o desenho da vaga com a área.</div>
</div>

<div class="box" style="left:1094px;top:580px;width:768px;height:430px"><h2>Onde acontece: "Voltou de etapa"</h2><div class="h2s">aplicações com o alerta · % sobre as aplicações de cada um</div>
<div class="sg"><span class="on">Recrutador</span><span>Etapa</span><span>Vaga</span><span>Esteira</span><span>Especialidade</span></div>
<div style="margin-top:16px">
<div class="r"><span>Marina L.</span><span class="b" style="width:88%"></span><span class="x">412 · 9%</span></div>
<div class="r"><span>Pedro A.</span><span class="b" style="width:64%"></span><span class="x">301 · 7%</span></div>
<div class="r"><span>Laura F.</span><span class="b" style="width:51%"></span><span class="x">240 · 5%</span></div>
<div class="r"><span>Elisa G.</span><span class="b" style="width:33%"></span><span class="x">156 · 4%</span></div>
<div class="r"><span>Rafael C.</span><span class="b" style="width:20%"></span><span class="x">94 · 3%</span></div>
<div class="r"><span>Bianca T.</span><span class="b" style="width:17%"></span><span class="x">80 · 2%</span></div>
<div class="r"><span>(sem recrutador)</span><span class="b" style="width:15%"></span><span class="x">71 · 1%</span></div></div>
<div class="h2s" style="margin-top:10px">clique numa barra para filtrar a lista · top 10, rolagem para o resto</div></div>

<div class="box" style="left:310px;top:1028px;width:1552px;height:560px">
<div class="t2top"><span class="n">8.023</span><span style="font-size:15px">aplicações com "Voltou de etapa"</span><span class="ok">✓ igual ao gráfico "Tipos de alerta"</span></div>
<div class="seg" style="margin-top:12px"><span class="s on">Todas <b>8.023</b></span><span class="s">Em andamento <b>2.140</b></span><span class="s">Rejeitada <b>5.611</b></span><span class="s">Contratada <b>212</b></span><span class="s">Declinou <b>60</b></span></div>
<div class="bar"><div class="search">Buscar candidato, vaga, recrutador, motivo…</div><div class="btn">Colunas ▾</div><div class="btn">⤓ Exportar CSV</div></div>
<table><tr><th></th><th>Greenhouse</th><th>Candidato</th><th>Alertas</th><th>Situação</th><th>Etapa atual</th><th>Onde voltou</th><th>Candidatura</th><th>SLA (dias)</th><th>Vaga</th><th>Esteira</th><th>Recrutador</th></tr>
<tr class="sel"><td>▾</td><td><a>Abrir ↗</a></td><td><b>Ana Souza</b></td><td><span class="al">Voltou de etapa (1×)</span></td><td><span class="pill pr">Rejeitada</span></td><td>Phone Screening</td><td>Ranking Score → Entrevista Inteligente</td><td>02/07/26</td><td><span class="dd dok">19</span></td><td>[Pool B2C] Assessoria · SP</td><td>(Sem esteira)</td><td>Marina L.</td></tr>
<tr><td colspan="12" class="tl"><span class="st"><b>Revisão de aplicação</b> 02/07 → 02/07 · 0 d</span><span class="st"><b>Entrevista Inteligente</b> 02/07 → 14/07 · 12 d</span><span class="st vt"><b>Ranking Score</b> 14/07 → 14/07 · 0 d · voltou</span><span class="st rj"><b>Phone Screening</b> 14/07 → 21/07 · 7 d · rejeitada</span><span class="st off">Offer · não chegou</span><span class="st">Soma: <b>19 dias</b></span></td></tr>
<tr><td>▸</td><td><a>Abrir ↗</a></td><td><b>Gustavo Melo</b></td><td><span class="al">Voltou de etapa (1×)</span><span class="al">Etapa de configuração</span></td><td><span class="pill pd">Em andamento</span></td><td>Phone Screening</td><td>Offer → Phone Screening</td><td>18/08/26</td><td><span class="dd dwa">38</span></td><td>[2026] Pool Eng. Back-end</td><td>(Sem esteira)</td><td>Pedro A.</td></tr>
<tr><td>▸</td><td><a>Abrir ↗</a></td><td><b>Helena Dias</b></td><td><span class="al">Voltou de etapa (1×)</span></td><td><span class="pill pr">Rejeitada</span></td><td>Triagem</td><td>Phone Screening → Triagem</td><td>30/06/26</td><td><span class="dd dba">78</span></td><td>Analista de Seg. Info Sr.</td><td>Tecnologia - Segurança</td><td>Laura F.</td></tr>
<tr><td>▸</td><td><a>Abrir ↗</a></td><td><b>Igor Santos</b></td><td><span class="al">Voltou de etapa (2×)</span><span class="al ad">Etapas em dobro</span></td><td><span class="pill pd">Em andamento</span></td><td>Revisão de aplicação</td><td>Entrevista → Revisão de aplicação</td><td>01/07/26</td><td><span class="dd dba">116</span></td><td>Group Product Manager</td><td>Produto</td><td>Elisa G.</td></tr>
<tr><td>▸</td><td><a>Abrir ↗</a></td><td><b>Júlia Costa</b></td><td><span class="al">Voltou de etapa (1×)</span></td><td><span class="pill pa">Contratada</span></td><td>Offer</td><td>Entrevista com supervisor → Phone Screening</td><td>12/07/26</td><td><span class="dd dwa">41</span></td><td>Assessoria Future · BH</td><td>B2C - XP Future</td><td>Marina L.</td></tr>
</table>
<div class="foot">Mostrando 50 de 8.023 &nbsp; <span class="btn" style="padding:4px 10px">Mostrar mais 100 ▾</span> &nbsp; contagens por tipo são reais (25/10/2026); nomes, recrutadores e vagas são fictícios</div></div>
"""

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS.replace('HEIGHT', '1660')}{EXTRA}</style></head>
<body><div class="pg"><img class="bg" src="{BG}">{FILTROS.replace('Dados do dash: as aplicações por trás de cada número', SUB)}{BODY}
<div class="lab" style="top:1610px">Data Quality · cards com ⓘ, tipos clicáveis, "Onde acontece" com botões, tabela 2.0 com cores de SLA</div></div></body></html>"""
(OUT / "44-data-quality.html").write_text(html, encoding="utf-8")
