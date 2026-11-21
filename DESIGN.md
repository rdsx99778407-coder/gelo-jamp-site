# DESIGN.md — Gelo Jamp

Documento permanente de identidade visual. Toda mudança de interface deve partir daqui.
Se uma decisão nova contrariar algo abaixo, atualize este arquivo junto com o código.

---

## 1. Marca, público e posicionamento

| | |
|---|---|
| **O que é** | Distribuidora de gelo em Jampruca - MG (Rua Belo Horizonte, 87, Centro). Vende gelo em cubos (sacos de 5 kg e 10 kg) e aluga cooler. |
| **Quem compra** | Gente da cidade e da região organizando festa, churrasco ou evento, e bares/comércios que precisam de reposição. Maioria no celular, com pressa. |
| **Trabalho do site** | Fazer a pessoa pedir pelo WhatsApp em poucos segundos e saber se a entrega chega até ela. |
| **Tom** | Comércio local, direto e confiável. Fala como o dono falaria no balcão: concreto, sem promessa vaga. |
| **Diferencial real** | Gelo de água potável e filtrada, atendimento de quem é da cidade, pedido direto pelo WhatsApp. Nada além disso pode ser afirmado sem confirmação do cliente (prazos, horários, preços). |

## 2. Direção estética: "rótulo de saco de gelo"

A identidade vem do próprio produto: a etiqueta impressa do saco de gelo e o freezer.

- **Tipo largo e pesado** (Archivo em `font-stretch: 125%`, peso 900) como o texto impresso na embalagem.
  É o elemento marcante e aparece em poucos lugares: o nome no hero, o **peso dos produtos** ("5 kg", "10 kg"),
  a marca no cabeçalho e o "404".
- **Cores do freezer e da água**, com um único acento quente.
- **Curvas de nível** no card de entrega: fala de geografia (onde entregamos), não é enfeite.
- **Fotos reais** do produto e do freezer. Nada de ilustração genérica ou ícone 3D.

### O que esta direção recusa (auditoria de "AI slop")

| Padrão genérico | Situação | Decisão |
|---|---|---|
| Gradiente roxo → azul | Não existe no site. Havia um tom roxo pastel (`#F3E8FF`) num indicador do painel. | Removido. Roxo não faz parte da paleta. |
| Hero centralizado | O hero é alinhado à esquerda, com foto real ao lado. | Mantido. |
| Três cards de funcionalidades | "Gelo de qualidade / Entrega na região / Pedido rápido" com ícones, repetidos na página Sobre. | Trocado por **"Como pedir"**: 3 passos reais em sequência, sem números grandes (a ordem vem da lista e do texto). |
| Glassmorphism e sombra decorativa | Sem vidro. Sombra grande na etiqueta do telefone flutuando sobre a foto. | Etiqueta presa à foto, com borda, sem sombra flutuante. |
| Cards e badges de template | Emojis em quadrados pastel no painel (📦 ⭐ 🛒 🖼️) e emojis coloridos como botões (✏️ 🗑️). | Indicadores só com número e rótulo; ícones de traço desenhados no mesmo estilo dos demais. |
| Tipografia genérica | Já resolvido na rodada anterior (Archivo larga). | Mantido. |
| Bordas e espaços uniformes | Raio único em tudo. | Hierarquia de raios (seção 5). |
| Animação repetitiva | Não há animação em loop. | Mantido. Movimento só como resposta a ação. |
| Texto de marketing artificial | "Mais que gelo, compromisso com o seu evento", "Qualidade, agilidade e atendimento próximo", "Fique por dentro das novidades, promoções e bastidores", "respondemos rapidinho". | Reescrito com fatos: produto, peso, água filtrada, endereço, como pedir. |
| Mesma composição em todas as páginas | Faixa do Instagram e bloco de mapa repetidos em quase todas as páginas. | Mapa só na inicial (destino de "Contato") e na Sobre. Faixa do Instagram removida; o Instagram fica no contato e no rodapé. |

## 3. Cores

Todas as combinações de texto abaixo passam no WCAG 2.2 AA (4,5:1 para texto normal).

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `--escuro` (tinta) | `#0A2540` | Texto de títulos, fundos escuros, botão "Como chegar" | 14,3:1 no gelo |
| `--texto` | `#1E3348` | Texto corrido | — |
| `--texto-suave` | `#4A6078` | Texto secundário, legendas, ajuda de campo | 6,5:1 no branco |
| `--claro` (azul Jamp) | `#0B5FB0` | Links, foco, botão azul do painel | branco sobre ele 6,4:1 |
| `--claro2` (água) | `#BFE3F8` | Bordas fortes, contornos, número 404 | 11,5:1 sobre a tinta |
| `--gelo` | `#EEF7FD` | Fundo de seções claras | — |
| `--linha` | `#D9E8F3` | Bordas sutis | — |
| `--verde` | `#0E7A3D` | **Somente** ações de WhatsApp (pedido, contato) | branco sobre ele 5,4:1 |
| `--sol` | `#FFC531` | **Acento único**: entrega na região (selo do hero, alfinete do mapa) | tinta sobre ele 9,8:1 |
| erro | `#B42318` | Mensagens e campos com erro | 6,5:1 no branco |

Regras:
- Verde = WhatsApp. Não usar verde para outra coisa.
- Amarelo-sol só aparece ligado a "entrega/região". Nunca como cor de botão genérico.
- Fundo escuro em no máximo um bloco por tela de rolagem (card de entrega, rodapé).

## 4. Tipografia

Família única: **Archivo** (variável, eixos largura e peso), via Google Fonts.

| Papel | Tamanho | Largura / peso |
|---|---|---|
| Nome no hero | `clamp(2.8rem, 6.5vw, 5rem)` | 125% / 900 |
| Número de destaque (peso do produto, 404) | `clamp(1.9rem, 3vw, 2.4rem)` (404 maior) | 125% / 900 |
| Título de página interna (h1) | `clamp(2.2rem, 5vw, 3.4rem)` | 112% / 800 |
| Título de seção (h2) | `--h2-secao: clamp(1.9rem, 3.4vw, 2.6rem)` | 112% / 800 |
| Título em painel escuro (h2) | `--h2-painel: clamp(1.7rem, 3vw, 2.3rem)` | 112% / 800 |
| Texto corrido | 1rem a 1.2rem (lead) | 100% / 400 |
| Rótulos de formulário | .88rem | 100% / 800 |

Regras:
- Sem caixa alta em rótulos e botões; sentence case.
- Sem "eyebrow" (rótulo pequeno acima do título).
- Sem destacar uma palavra do título com outra cor.
- Linhas de texto até ~60 caracteres (`max-width: 52–60ch`).
- `text-wrap: balance` em títulos; nomes como "Jampruca - MG" nunca quebram (`white-space: nowrap`).

## 5. Espaços, bordas e superfícies

- **Escala de espaço:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 88 px. Seções: 88 px (desktop), 64 px (celular).
- **Hierarquia de raios** (do menor ao maior elemento):
  - 8 px: botões pequenos, etiquetas
  - 10–12 px: botões, campos, miniaturas
  - 16 px: cards de produto e de foto
  - 20–24 px: painéis (card de entrega, bloco de contato, Sobre)
  - pílula (999 px): só filtros da galeria e o selo do hero
- **Sombras:** só para separar o que flutua de verdade (menu aberto no celular, modal). Cards usam borda.
- **Bordas:** `--linha` para separar; `--escuro` 3 px no topo para listas de passos/fatos.

## 6. Componentes

- **Cabeçalho ("rótulo"):** fixo, fundo branco sólido (sem desfoque). Marca à esquerda, alinhada ao conteúdo, com o nome em tipo largo 900. Menu agrupado à direita, junto do bloco de pedido, nunca centralizado no vazio. Bloco verde **"Pedir pelo WhatsApp"** na altura toda, encostado na borda direita da tela, com foco por dentro (moldura branca). Alturas: 76 px (desktop/tablet) e 64 px (celular). Menu recolhe no ☰ até 1000 px; no celular o bloco mostra só o ícone (texto mantido para leitores de tela). Não há botão flutuante: o bloco do cabeçalho fixo cumpre esse papel.
- **Rodapé ("verso da etiqueta"):** fundo tinta. Em cima, a marca escrita em tipo largo 900 com o slogan (sem repetir "Gelo Jamp") e o botão "Pedir pelo WhatsApp". No meio, os dados como campos de etiqueta (`<dl>`): rótulo pequeno em #9DBBDB, valor em branco, fio superior — Endereço (link para o mapa), WhatsApp, Instagram, Entrega. Embaixo, uma linha com o menu compacto e o copyright. Sem colunas de modelo pronto nem ícones decorativos.
- **Botões:** verde (WhatsApp), tinta (ação principal que não é WhatsApp), contorno (secundária), azul (ações do painel). Rótulo diz o que acontece: "Pedir pelo WhatsApp", "Como chegar", "Salvar produto".
- **Card de produto:** foto 5:4, **peso em tipo largo** acima do nome, descrição, preço ("Consulte preço" quando vazio) e botão verde de largura total.
- **Passos "Como pedir":** lista ordenada (`<ol>`) sem números visíveis; cada passo com borda superior de 3 px, título curto e uma frase. Não usar números grandes decorativos.
- **Etiqueta do telefone (hero):** presa à borda da foto, borda fina, sem sombra flutuante; é um link para o WhatsApp.
- **Card de entrega:** fundo tinta, curvas de nível em azul-água (opacidade .3), alfinete amarelo-sol.
- **Formulários (painel):** rótulo acima, ajuda abaixo em `--texto-suave`, erro em linha em `#B42318` com `aria-invalid`, foco no primeiro erro. Checkbox com rótulo como alvo único de 44 px.
- **Indicadores do painel:** número em tipo largo + rótulo. Sem emoji, sem quadrado colorido.
- **Ícones:** traço de 2 px, `currentColor`, 20–24 px, decorativos com `aria-hidden`. Nada de emoji como ícone de interface.

## 7. Imagens

- Fotos reais, recortadas por `object-fit: cover` em proporções fixas (hero 4:5, produto 5:4, galeria 4:3,4).
- JPEG até 1200 px + WebP ao lado; originais em `assets-originais/`.
- `width`/`height` sempre declarados; `loading="lazy"` fora da primeira dobra; `fetchpriority="high"` só na foto do hero.

## 8. Movimento

- Nenhuma animação automática em loop.
- Transições de 0,2 s em cor, borda e sombra; `transform` só em `:active` (1 px) e no zoom leve da foto da galeria.
- `prefers-reduced-motion` desliga transições.

## 9. Estados

| Estado | Como aparece |
|---|---|
| Carregando (painel) | "–" nos indicadores e "Carregando pedidos…" na tabela |
| Vazio | Frase que diz o que fazer: "Nenhum produto cadastrado. Use "Novo produto"…" |
| Erro de campo | Mensagem junto ao campo, com a correção ("Use só números, por exemplo 18,00.") |
| Erro geral | Aviso (toast) com a mensagem da API |
| Enviando | Botão desabilitado com "Salvando…" / "Entrando…" |
| Sucesso | Aviso curto com o mesmo verbo do botão ("Produto salvo") |
| Pedido feito | "Abrimos o WhatsApp com o pedido de … É só enviar a mensagem para confirmar." |
| Página inexistente | 404 com "404" em tipo largo e três saídas: início, produtos, WhatsApp |

## 10. Voz do texto

- Fatos no lugar de adjetivos: "saco de 5 kg", "água potável e filtrada", "Rua Belo Horizonte, 87".
- Verbo de ação nos botões; mesmo verbo do botão no aviso de sucesso.
- Sem promessas não confirmadas (prazo de entrega, horário, "o melhor gelo").
- Travessão só quando nenhuma pontuação simples serve.

## 11. Onde isso vive no código

- Tokens e componentes: `public/css/estilos.css` (seção `:root` no topo).
- Textos fixos: páginas em `public/*.html`; textos vindos da configuração: `public/js/demo.js` (`EMPRESA`, `CONFIG_PADRAO`).
- Painel: `public/admin.html` + `public/js/admin.js`.

## 12. Histórico de decisões

### 2026-11-20 — Auditoria de padrões genéricos e redesign
- Página inicial: "Mais que gelo, compromisso com o seu evento" (3 cards com ícone) virou **"Como pedir"** (3 passos em sequência).
- Faixa "Acompanhe no Instagram" removida da inicial e da galeria; Instagram entrou no bloco de contato.
- Bloco de mapa removido de Produtos e Galeria (continua na inicial, destino de "Contato", e na Sobre).
- Sobre: card escuro com logo e cards repetidos trocados por texto e lista de fatos; segundo CTA escuro removido; linha "Localização" repetida removida.
- Etiqueta do telefone no hero presa à foto, com borda e sem sombra flutuante.
- Textos genéricos reescritos com fatos (seção 10).
- Painel: indicadores sem emoji e sem roxo; emojis de editar/excluir trocados por ícones de traço; menu lateral sem botões esticados; títulos das caixas em h2; e-mail do usuário lido do token; exemplos nos campos de configuração.
- 404: número em azul Jamp (contraste 5,9:1).
- Comparação antes/depois: `docs/comparacao-redesign/`.

### 2026-11-20 — Cabeçalho, proposta B ("rótulo do saco de gelo")
- Menu deixou de ser centralizado: agrupado à direita, junto do bloco de pedido; marca com o nome em tipo largo 900.
- Bloco verde "Pedir pelo WhatsApp" na altura toda, encostado na borda; sem telefone dentro (já está no hero).
- Botão flutuante removido: no celular, o bloco (só ícone) do cabeçalho fixo cumpre o papel.
- Fundo do cabeçalho sólido (saiu o desfoque); altura 76 px / 64 px no celular.
- Todos os botões de pedido passaram a dizer "Pedir pelo WhatsApp".
- Correções encontradas no caminho: texto padrão antigo do hero no `demo.js`; colunas de grid e botões que alargavam a página em telas estreitas.

### 2026-11-20 — Passos sem números
- A pedido do cliente, os números grandes (1, 2, 3) saíram da seção "Como pedir". A sequência continua como lista ordenada (`<ol>`) e pelo texto; visualmente, cada passo é marcado pela borda superior.

### 2026-11-20 — Rodapé "verso da etiqueta"
- Saíram as três colunas padrão (marca/menu/contato). Entrou: marca escrita grande + slogan + pedido; campos Endereço/WhatsApp/Instagram/Entrega; linha final com menu e copyright.
- Endereço completo voltou ao rodapé, como link para o mapa; "Cidade - UF" nunca quebra de linha.
- Slogan padrão sem o nome repetido ("Qualidade e frescor para seus melhores momentos!").
- Corrigido o desalinhamento da logo (cabeçalho e rodapé): com `picture{display:contents}` o `<source>` recebia o gap do flex; agora `picture > source{display:none}`.
