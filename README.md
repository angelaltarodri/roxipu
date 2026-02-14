# Pacman (Angular 20)

Mini-juego tipo Pacman en Angular 20:

- Se mueve con las flechas del teclado.
- El tablero es un rectángulo negro.
- Las monedas se renderizan con una constante `COIN_GRID` que es un array de arrays con `0` y `1`.
- Si Pacman pisa una celda con `1`, la moneda desaparece (se convierte a `0`) y sube el score.
- Mantén presionada la barra espaciadora para modo turbo (más rápido) con “nube de polvo” y avance automático.
- Cuando se acaban las monedas, el tablero se llena de chocolates; al comerlos se revela `src/assets/quieresser.jpeg` por celdas hasta mostrarse completa.
- Sonidos: al comer monedas suena `mariocoin.mp3`, al comer chocolates suena `gogo.mp3` (primer segundo), y al acabarse las monedas empieza `lavidaesgogo.mp3`.

## Ejecutar

```bash
npm install
npm start
```
