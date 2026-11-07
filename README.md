## Weather CLI APP

El objetivo de esta aplicación es que creemos una aplicación de consola que pida que ingresemos la ciudad, Al final, generaremos un binario ejecutable.

### Opciones:

- Ingresar el nombre de una ciudad.
- Guardar la ciudad por defecto.
- Registrar varias otras ciudades para buscar el clima en esas otras ciudades.

## Stack

- Bun.js
- OpenMeteo

## Ejemplo de petición http:

1. Paso 1: Geocoding API.
2. Paso 2: OpenMeteo API.

```
https://geocoding-api.open-meteo.com/v1/search?name=Ottawa&count=1&language=es&format=json
https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&current=temperature_2m
```

## Inicializar proyecto

```bash
bun init
```

### Ejemplo del menú
Esta es la apariencia que deseamos crear

```bash
════════════════════════════════════════
         WEATHER CLI
════════════════════════════════════════
  1. Clima de ciudad default
  2. Clima de todas las ciudades (1)
  3. Buscar y agregar ciudad
  4. Eliminar ciudad
  5. Establecer ciudad default
  8. Ajustes (°C)
  9. Salir
════════════════════════════════════════
  Selecciona una opción: 5
```

### Errores a corregir

1. El primer comportamiento erroneo es que en el menú para la opción 2 no se muestra la cantidad de ciudades guardadas correctamente, solo se muestra:
```bash
  2. Clima de todas las ciudades (1)
```
a pesar de que por ejemplo se tengan guardades 3 ciudades con lo que se esperaria un comportamiento:
```bash
  2. Clima de todas las ciudades (3)
```
2. El segundo error es que al momento de buscar una ciudad se muestran 5 opciones por ejemplo al buscar la ciudad pasto
```bash
Se encontraron varias coincidencias:
  1. Pasto
  2. Pasto
  3. Pasto
  4. Pasto
  5. Pasto
Selecciona una opción (0 para cancelar):
```
de esta manera no es posible identificar el departamento ni el país de la ciudad esto hace muy dificil saber si se selecciona la opción correcta, la idea es que se agregue el departamento y país de la ciudad al menu para una mejor identificación.
3. El tercer error es que se espera que con cada selección del usuario se borre la pantalla para mostrar el nuevo contenido, no que vaya dejando todo el contenido previo en la pantalla, ya que esto hace difícil leer la información