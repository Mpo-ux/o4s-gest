# Roadmap de Implementação

Este ficheiro acompanha a evolução do projeto segundo as fases definidas.

---

## Fase 1: Base Sólida e Infraestrutura Crítica (Agora)
- [ ] Testar todos os fluxos de login, logout, token expirado, refresh
- [ ] Validar ligação à Supabase e estrutura da base de dados
- [ ] Implementar verificação para evitar duplicações (ex: email)
- [ ] Estruturar gestão de roles (admin/user)
- [ ] Garantir fallback de portas e scripts PowerShell resilientes
- [ ] Integrar logger no backend (Winston)
- [ ] Middleware de validação (Joi/Zod)
- [ ] Testes unitários com Vitest para funções críticas

## Fase 2: Módulos Funcionais e Importação de Dados (Próximas Semanas)
- [ ] Módulo Admin: upload de ficheiros Excel (SheetJS)
- [ ] Gestão de utilizadores (aprovação, edição, remoção)
- [ ] Endpoint /health para self-diagnóstico
- [ ] Scripts para transformar Excel → JSON → Supabase
- [ ] Validação de dados antes do upload
- [ ] Logs de importação (sucesso, erros, duplicados)

## Fase 3: Qualidade e Testes Automatizados (Após estabilização dos módulos)
- [ ] Expandir testes unitários (Vitest)
- [ ] Testes end-to-end (Cypress)
- [ ] CI/CD com GitHub Actions (lint, type-check, testes, deploy)

## Fase 4: Monitorização, Segurança e Escalabilidade
- [ ] Monitorização e logs estruturados
- [ ] Alertas no módulo admin
- [ ] Rate limiting, Helmet, CORS
- [ ] Auditoria de roles e permissões
- [ ] Internacionalização (react-i18next)

---

> Atualiza este ficheiro à medida que fores avançando nas tarefas. Podes usar este roadmap como base para um quadro Kanban ou para reuniões semanais de acompanhamento.
