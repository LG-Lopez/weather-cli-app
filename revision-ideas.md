# Revisión Weather CLI

- [x] **Colores:** no hay ninguno; falta definir cyan (menú), amarillo (temp), verde/rojo (ok/error).
- [] **AGENTS.md:** dice que `index.ts` es stub, pero la app ya funciona — hay que actualizarlo.
- [x] **Ciudades:** geocoding solo trae 1 resultado; nombres ambiguos pueden fallar.
- [x] **Tests:** no existen; conviene al menos probar storage y las APIs con mocks.
- [] **Binario:** compila bien; revisar que `./weather` guarde datos en `~/.config/weather-cli/`.
- [] **Escalabilidad:** ¿qué tan fácil será expandir con nuevas funcionalidades?
- [] **Carga:** ¿hay estado de carga en las tareas asíncronas?
- [x] **7 days forecasts:** Agrega la posibilidadd de obtener el pronostico del clíma para los próximos 7 días.