-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: meseros
-- ------------------------------------------------------
-- Server version	8.0.43-0ubuntu0.24.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `detallepedido`
--

DROP TABLE IF EXISTS `detallepedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detallepedido` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int DEFAULT NULL,
  `producto_id` int DEFAULT NULL,
  `cantidad` int NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `detallepedido_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `detallepedido_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detallepedido`
--

LOCK TABLES `detallepedido` WRITE;
/*!40000 ALTER TABLE `detallepedido` DISABLE KEYS */;
INSERT INTO `detallepedido` VALUES (1,1,2,1,8000.00),(2,2,4,5,25000.00),(3,3,2,1,8000.00),(4,3,4,2,10000.00),(5,6,2,1,8000.00),(6,5,4,1,5000.00),(7,7,5,2,10000.00),(8,8,6,1,15000.00),(9,8,6,3,45000.00),(10,9,7,2,6000.00),(11,9,6,1,15000.00),(12,9,8,1,15000.00),(13,9,7,20,60000.00),(14,10,6,4,60000.00),(15,10,8,1,15000.00);
/*!40000 ALTER TABLE `detallepedido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mesas`
--

DROP TABLE IF EXISTS `mesas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mesas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` int NOT NULL,
  `capacidad` int DEFAULT NULL,
  `estado` enum('libre','ocupada','cerrada','limpieza') DEFAULT 'libre',
  `restaurant_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mesas_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_mesas_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurantes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mesas`
--

LOCK TABLES `mesas` WRITE;
/*!40000 ALTER TABLE `mesas` DISABLE KEYS */;
INSERT INTO `mesas` VALUES (1,1,4,'libre',1),(2,2,10,'limpieza',1),(3,3,4,'limpieza',1),(4,4,4,'libre',1),(5,1,4,'libre',2),(6,5,8,'libre',1),(7,2,10,'libre',2),(8,6,8,'libre',1),(9,1,4,'libre',6),(10,2,4,'limpieza',6),(11,3,2,'libre',6);
/*!40000 ALTER TABLE `mesas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meseros`
--

DROP TABLE IF EXISTS `meseros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meseros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `sueldo_base` decimal(10,2) DEFAULT NULL,
  `restaurant_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_meseros_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_meseros_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurantes` (`id`),
  CONSTRAINT `meseros_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meseros`
--

LOCK TABLES `meseros` WRITE;
/*!40000 ALTER TABLE `meseros` DISABLE KEYS */;
INSERT INTO `meseros` VALUES (1,NULL,'Juan','activo',NULL,1),(2,NULL,'Sofia','activo',NULL,1),(3,NULL,'Sebastian','activo',NULL,2),(4,NULL,'Felipe','activo',NULL,1),(5,6,'Juan','activo',NULL,1),(6,8,'Wilmer','activo',NULL,6);
/*!40000 ALTER TABLE `meseros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientoscontables`
--

DROP TABLE IF EXISTS `movimientoscontables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientoscontables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` datetime DEFAULT NULL,
  `tipo` enum('ingreso','egreso') NOT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` text,
  `mesa_id` int DEFAULT NULL,
  `pedido_id` int DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `restaurant_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_movc_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_movc_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurantes` (`id`),
  CONSTRAINT `movimientoscontables_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientoscontables`
--

LOCK TABLES `movimientoscontables` WRITE;
/*!40000 ALTER TABLE `movimientoscontables` DISABLE KEYS */;
INSERT INTO `movimientoscontables` VALUES (1,'2025-10-27 19:15:55','ingreso','venta',8000.00,'Venta pedido #1 mesa 2',2,1,NULL,1),(2,'2025-10-27 19:20:10','ingreso','venta',25000.00,'Venta pedido #2 mesa 1',1,2,NULL,1),(3,'2025-10-27 19:20:10','ingreso','propina',5000.00,'Propina pedido #2 mesa 1',1,2,NULL,1),(4,'2025-10-28 18:52:38','ingreso','venta',18000.00,'Venta pedido #3 mesa 2',2,3,NULL,1),(5,'2025-10-28 18:54:26','ingreso','venta',8000.00,'Venta pedido #6 mesa 1',1,6,NULL,1),(6,'2025-10-28 18:54:26','ingreso','propina',4000.00,'Propina pedido #6 mesa 1',1,6,NULL,1),(7,'2025-10-28 18:55:08','ingreso','venta',5000.00,'Venta pedido #5 mesa 3',3,5,NULL,1),(8,'2025-10-28 18:56:46','ingreso','venta',10000.00,'Venta pedido #7 mesa 2',2,7,NULL,1),(9,'2025-10-28 19:33:33','ingreso','venta',60000.00,'Venta pedido #8 mesa 9',9,8,NULL,6),(10,'2025-10-28 19:33:33','ingreso','propina',5000.00,'Propina pedido #8 mesa 9',9,8,NULL,6),(11,'2025-10-28 19:40:29','ingreso','venta',96000.00,'Venta pedido #9 mesa 9',9,9,NULL,6),(12,'2025-10-28 19:42:33','ingreso','venta',75000.00,'Venta pedido #10 mesa 10',10,10,NULL,6);
/*!40000 ALTER TABLE `movimientoscontables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nomina_movimientos`
--

DROP TABLE IF EXISTS `nomina_movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nomina_movimientos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mesero_id` int NOT NULL,
  `tipo` enum('bono','adelanto','descuento','pago') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` text,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `restaurant_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mesero_id` (`mesero_id`),
  KEY `idx_nomina_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_nomina_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurantes` (`id`),
  CONSTRAINT `nomina_movimientos_ibfk_1` FOREIGN KEY (`mesero_id`) REFERENCES `meseros` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nomina_movimientos`
--

LOCK TABLES `nomina_movimientos` WRITE;
/*!40000 ALTER TABLE `nomina_movimientos` DISABLE KEYS */;
INSERT INTO `nomina_movimientos` VALUES (1,1,'bono',2000.00,'Bono','2025-09-29 00:00:00',1),(2,2,'bono',15000.00,'Bono','2025-10-10 00:00:00',1),(3,2,'bono',15000.00,'Bono','2025-10-10 00:00:00',1),(4,6,'bono',15000.00,'Bono','2025-10-27 00:00:00',6);
/*!40000 ALTER TABLE `nomina_movimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mesa_id` int DEFAULT NULL,
  `mesero_id` int DEFAULT NULL,
  `fecha_hora` datetime DEFAULT NULL,
  `estado` enum('en proceso','entregado','cerrado') DEFAULT 'en proceso',
  `total` decimal(10,2) DEFAULT '0.00',
  `restaurant_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mesa_id` (`mesa_id`),
  KEY `mesero_id` (`mesero_id`),
  KEY `idx_pedidos_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_pedidos_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurantes` (`id`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`mesa_id`) REFERENCES `mesas` (`id`),
  CONSTRAINT `pedidos_ibfk_2` FOREIGN KEY (`mesero_id`) REFERENCES `meseros` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (1,2,NULL,'2025-10-27 19:15:26','cerrado',8000.00,1),(2,1,NULL,'2025-10-27 19:19:09','cerrado',25000.00,1),(3,2,NULL,'2025-10-28 18:47:44','cerrado',18000.00,1),(4,4,NULL,'2025-10-28 18:52:04','en proceso',0.00,1),(5,3,NULL,'2025-10-28 18:52:06','cerrado',5000.00,1),(6,1,NULL,'2025-10-28 18:53:55','cerrado',8000.00,1),(7,2,NULL,'2025-10-28 18:56:32','cerrado',10000.00,1),(8,9,NULL,'2025-10-28 19:31:33','cerrado',60000.00,6),(9,9,NULL,'2025-10-28 19:37:15','cerrado',96000.00,6),(10,10,NULL,'2025-10-28 19:41:44','cerrado',75000.00,6);
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sku` varchar(64) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `categoria` varchar(64) DEFAULT NULL,
  `precio` decimal(8,2) NOT NULL,
  `costo` decimal(12,2) NOT NULL DEFAULT '0.00',
  `stock` int NOT NULL DEFAULT '0',
  `min_stock` int NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `descripcion` text,
  `restaurant_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_productos_restaurant` (`restaurant_id`),
  CONSTRAINT `fk_productos_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurantes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (2,'CAP-VAI-01','Capuchino Vainilla Grande','Bebidas Calientes',8000.00,5000.00,20,2,1,'Bebidas Calientes',1,'2025-10-13 00:51:21','2025-10-13 00:51:21'),(3,'MIL-FRIO-01','Milo Frio Grande','Bebidas Frías',6500.00,3000.00,20,2,1,'Bebidas Frías',2,'2025-10-13 01:02:39','2025-10-13 01:07:26'),(4,'SANDWICH-POLLO-1','Sandwich de Pollo grande','Desayunos',5000.00,3500.00,20,5,0,'Desayunos',1,'2025-10-27 19:18:41','2025-10-27 19:18:41'),(5,'JUG-MORA-1','Jugo de mora grande','Bebidas naturales',5000.00,3000.00,20,5,1,'Bebidas naturales',1,'2025-10-28 18:56:16','2025-10-28 18:56:16'),(6,'LECH-GRAN','Lechona grande','Comida rapida',15000.00,12000.00,11,2,0,'Comida rapida',6,'2025-10-28 19:28:12','2025-10-28 19:41:49'),(7,'BUE-GRAN','Buñuelo grande','Comida rapida',3000.00,1000.00,48,5,0,'Comida rapida',6,'2025-10-28 19:36:51','2025-10-28 19:40:06'),(8,'GASEOSA-GRAN-COCA COLA-3L','Coca cola 3L','bebidas',15000.00,10000.00,8,2,1,'bebidas',6,'2025-10-28 19:39:46','2025-10-28 19:42:21');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurantes`
--

DROP TABLE IF EXISTS `restaurantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurantes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  UNIQUE KEY `uq_restaurantes_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurantes`
--

LOCK TABLES `restaurantes` WRITE;
/*!40000 ALTER TABLE `restaurantes` DISABLE KEYS */;
INSERT INTO `restaurantes` VALUES (6,'LechoneriaExpress'),(1,'Restaurante Central'),(3,'Restaurante Express'),(4,'Restaurante Familiar'),(2,'Restaurante Gourmet'),(5,'Restaurante Urbano');
/*!40000 ALTER TABLE `restaurantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `turnos`
--

DROP TABLE IF EXISTS `turnos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turnos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mesero_id` int DEFAULT NULL,
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `total_ventas` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `mesero_id` (`mesero_id`),
  CONSTRAINT `turnos_ibfk_1` FOREIGN KEY (`mesero_id`) REFERENCES `meseros` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `turnos`
--

LOCK TABLES `turnos` WRITE;
/*!40000 ALTER TABLE `turnos` DISABLE KEYS */;
/*!40000 ALTER TABLE `turnos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `restaurante` varchar(100) DEFAULT NULL,
  `contrasena` varchar(255) NOT NULL,
  `rol` enum('admin','mesero') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Admin Principal','admin@meseros.local','Restaurante Central','$2b$10$aduRd8Wm33WJtuytdWFPfOJ3xR3F09H4rrAZtsYVN5cEChdFFCO4C','admin'),(2,'Maria Gomez','maria.gomez@meseros.local','Restaurante Gourmet','$2b$10$aduRd8Wm33WJtuytdWFPfOJ3xR3F09H4rrAZtsYVN5cEChdFFCO4C','admin'),(3,'Julian Perez','julian.perez@meseros.local','Restaurante Express','$2b$10$aduRd8Wm33WJtuytdWFPfOJ3xR3F09H4rrAZtsYVN5cEChdFFCO4C','mesero'),(4,'Luisa Fernandez','luisa.fernandez@meseros.local','Restaurante Familiar','$2b$10$aduRd8Wm33WJtuytdWFPfOJ3xR3F09H4rrAZtsYVN5cEChdFFCO4C','admin'),(5,'Pedro Sanchez','pedro.sanchez@meseros.local','Restaurante Urbano','$2b$10$aduRd8Wm33WJtuytdWFPfOJ3xR3F09H4rrAZtsYVN5cEChdFFCO4C','admin'),(6,'Juan','juan.velasquez@mesero.com','Restaurante Central','$2b$10$iQWtbvNjSaj3YjQx112gW.H2CYxn8Ln3PS5JUV3l7Po0RQ76jR9eS','mesero'),(7,'Miguel Mendez','miguel.mendez@mesoft.com','LechoneriaExpress','$2b$10$c9YhgBQlnqVE/a5k5p6EFeUj4cURWwTKv0fRf71WCx4m7Ql7mtz6u','admin'),(8,'Wilmer','wilmer.ajala@lechonaexpres.com','LechoneriaExpress','$2b$10$SiUT9iSef/KHjUj6mbvooOk58eTghG2WjfZA3miOv/WB5NmZCobmW','mesero');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-29 14:43:33
