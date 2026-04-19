# grana.app

Dashboard de controle financeiro pessoal — tema escuro, localStorage, sem servidor.

## Estrutura

```
grana-app/
├── index.html          ← tela de login
├── app.html            ← dashboard principal
├── css/
│   └── style.css       ← visual completo
└── js/
    ├── auth.js         ← login e sessão
    ├── db.js           ← camada de dados (localStorage)
    ├── contas.js       ← contas e devedores
    └── dashboard.js    ← gráficos e alertas
```

## Como hospedar no GitHub Pages

1. Crie um repositório público no GitHub (ex: `grana-app`)
2. Faça upload de todos os arquivos mantendo a estrutura de pastas
3. Vá em **Settings → Pages**
4. Em "Source" selecione `Deploy from a branch` → `main` → `/ (root)`
5. Clique **Save** — em ~1 minuto a URL estará disponível

## Funcionalidades

- **Login por senha** com sessão de 24h (hash SHA-256)
- **Seletor de mês** — navegue entre períodos com ‹ ›
- **Contas dinâmicas** — adicione, edite e remova por mês
- **Salário por mês** — defina individualmente
- **Devedores** — quem te deve e status de recebimento
- **Gráficos** — resumo do mês e histórico de todos os meses
- **Alertas** — filtre por mês atual ou todos os períodos
- **Dados salvos** no localStorage do navegador

## Alterar a senha

A senha atual está hasheada em `js/auth.js` (variável `SENHA_HASH`).

Para gerar um novo hash SHA-256:
- Acesse https://emn178.github.io/online-tools/sha256.html
- Digite a nova senha e copie o hash
- Cole no lugar do valor de `SENHA_HASH` em `js/auth.js`

## Backup dos dados

Os dados ficam no localStorage do navegador. Para fazer backup:
- Abra o console do navegador (F12)
- Digite: `console.log(DB.exportar())`
- Copie o JSON e salve em algum lugar

Para restaurar:
- No console: `DB.importar('cole o json aqui')`
