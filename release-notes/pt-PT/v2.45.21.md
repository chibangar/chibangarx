## Novidades da versão 2.45.21

### Sistema de Clips - Gravação automática do jogo 🎮

**Nova funcionalidade principal**: Sistema completo de clips para gravar gameplay com um clique!

#### Funcionalidades:

- **Gravação automática via Global Media Server**: Captura streams de jogos e aplicações
- **Hotkey**: `Ctrl+Alt+S` para guardar clip instantaneamente
- **Buffer circular**: Mantém último minuto de vídeo na memória
- **Metadados completos**: Nome do jogo, duração, resolução, FPS

#### Interface nova:

**Página principal de clips:**
- Grid responsivo com layout adaptativo
- Pesquisa e filtragem por jogos específicos
- Ordenação por data, duração ou tamanho
- Marcadores de favoritos com estrelas

**Clip Player completo:**
- Controlos completos (play/pause)
- Volume ajustável com mute
- Velocidade do vídeo (0.5x a 2x)
- Barra de progresso arrastável
- Modo ecrã inteiro
- Botões para download e partilha

**Clip Editor:**
- Preview do vídeo com trim visual
- Sliders para cortar início/fim
- Exportação da versão editada
- Download do original mantendo o ficheiro intacto

#### Gestão de clips:

- **Lista de clips**: Visualiza todos os clips gravados
- **Filtros**: Por data (hoje, semana, mês), favoritos ou jogos específicos
- **Pesquisa**: Procura por nome do clip ou jogo
- **Metadados exibidos**: Duração, resolução, FPS, tamanho do ficheiro
- **Gestão fácil**: Abrir ficheiro, marcar favorito, apagar com confirmação

#### Requisitos:

- Funciona através de Global Media Server (Windows)
- Gravado na memória durante a sessão
- Metadados armazenados no `src/bucket/clips.json`
- Ficheiros mantidos separadamente da pasta de clips

Esta versão marca o lançamento do sistema de clips que permite gravar facilmente momentos dos jogos sem interromper o gameplay!
