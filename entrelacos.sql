-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           12.3.3-MariaDB - MariaDB Server
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.21.0.7344
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para entrelacos
DROP DATABASE IF EXISTS `entrelacos`;
CREATE DATABASE IF NOT EXISTS `entrelacos` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin */;
USE `entrelacos`;

-- Copiando estrutura para tabela entrelacos.animais
DROP TABLE IF EXISTS `animais`;
CREATE TABLE IF NOT EXISTS `animais` (
  `id_animal` int(11) NOT NULL AUTO_INCREMENT,
  `id_ong` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `especie` varchar(50) NOT NULL,
  `raca` varchar(100) DEFAULT NULL,
  `porte` varchar(20) NOT NULL,
  `idade` varchar(30) NOT NULL,
  `sexo` varchar(10) NOT NULL,
  `descricao` text NOT NULL,
  `status` varchar(20) NOT NULL,
  `imagem` longtext DEFAULT NULL,
  `ong` varchar(150) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `estado` char(2) NOT NULL,
  PRIMARY KEY (`id_animal`),
  KEY `fk_animais_ong` (`id_ong`),
  CONSTRAINT `fk_animais_ong` FOREIGN KEY (`id_ong`) REFERENCES `ong` (`id_ong`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela entrelacos.animais: ~1 rows (aproximadamente)
DELETE FROM `animais`;

-- Copiando estrutura para tabela entrelacos.atualizacao
DROP TABLE IF EXISTS `atualizacao`;
CREATE TABLE IF NOT EXISTS `atualizacao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `tipo` enum('adotante','ong') DEFAULT 'adotante',
  `foto_perfil` longtext DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela entrelacos.atualizacao: ~0 rows (aproximadamente)
DELETE FROM `atualizacao`;

-- Copiando estrutura para tabela entrelacos.cadastro
DROP TABLE IF EXISTS `cadastro`;
CREATE TABLE IF NOT EXISTS `cadastro` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(50) NOT NULL,
  `cep` varchar(100) NOT NULL,
  `cpf` varchar(20) NOT NULL,
  `telefone` varchar(20) NOT NULL,
  `data_nascimento` date NOT NULL,
  `senha` varchar(100) NOT NULL,
  `palavra_chave` varchar(50) DEFAULT NULL,
  `tipo` varchar(20) NOT NULL DEFAULT 'usuario',
  `foto_perfil` longtext DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `cpf` (`cpf`),
  UNIQUE KEY `telefone` (`telefone`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `cpf_2` (`cpf`),
  UNIQUE KEY `telefone_2` (`telefone`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `cpf_3` (`cpf`),
  UNIQUE KEY `telefone_3` (`telefone`)
) ENGINE=InnoDB AUTO_INCREMENT=8233 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela entrelacos.cadastro: ~0 rows (aproximadamente)
DELETE FROM `cadastro`;

-- Copiando estrutura para tabela entrelacos.dicas
DROP TABLE IF EXISTS `dicas`;
CREATE TABLE IF NOT EXISTS `dicas` (
  `id_dica` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `qualPet` varchar(50) NOT NULL,
  `conteudo` text NOT NULL,
  `data_criacao` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_dica`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela entrelacos.dicas: ~0 rows (aproximadamente)
DELETE FROM `dicas`;

-- Copiando estrutura para tabela entrelacos.doacao
DROP TABLE IF EXISTS `doacao`;
CREATE TABLE IF NOT EXISTS `doacao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `nome_ong` varchar(150) NOT NULL,
  `cidade_ong` varchar(100) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `classificacao` varchar(30) NOT NULL,
  `item` varchar(200) NOT NULL,
  `quantidade` varchar(100) DEFAULT NULL,
  `descricao` text NOT NULL,
  `local_entrega` varchar(255) NOT NULL,
  `tipo_entrega` varchar(50) NOT NULL,
  `tipo_pix` varchar(30) DEFAULT NULL,
  `pix` varchar(255) DEFAULT NULL,
  `banco` varchar(100) DEFAULT NULL,
  `conta` varchar(100) DEFAULT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela entrelacos.doacao: ~0 rows (aproximadamente)
DELETE FROM `doacao`;

-- Copiando estrutura para tabela entrelacos.eventos
DROP TABLE IF EXISTS `eventos`;
CREATE TABLE IF NOT EXISTS `eventos` (
  `id_evento` int(11) NOT NULL AUTO_INCREMENT,
  `id_ong` int(11) DEFAULT NULL,
  `nome_evento` varchar(100) DEFAULT NULL,
  `hora` varchar(20) DEFAULT NULL,
  `data` date DEFAULT NULL,
  `endereco` varchar(150) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `localizacao` varchar(150) DEFAULT NULL,
  `imagem` longtext DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`id_evento`),
  KEY `id_ong` (`id_ong`),
  CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`id_ong`) REFERENCES `ong` (`id_ong`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela entrelacos.eventos: ~0 rows (aproximadamente)
DELETE FROM `eventos`;

-- Copiando estrutura para tabela entrelacos.historias
DROP TABLE IF EXISTS `historias`;
CREATE TABLE IF NOT EXISTS `historias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `texto` text NOT NULL,
  `imagem1` longtext DEFAULT NULL,
  `imagem2` longtext DEFAULT NULL,
  `data_criacao` timestamp NULL DEFAULT current_timestamp(),
  `ong_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela entrelacos.historias: ~0 rows (aproximadamente)
DELETE FROM `historias`;

-- Copiando estrutura para tabela entrelacos.login
DROP TABLE IF EXISTS `login`;
CREATE TABLE IF NOT EXISTS `login` (
  `id_login` int(11) NOT NULL AUTO_INCREMENT,
  `id_cadastro` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(100) NOT NULL,
  PRIMARY KEY (`id_login`),
  KEY `fk_login_usuario` (`id_cadastro`),
  CONSTRAINT `fk_login_usuario` FOREIGN KEY (`id_cadastro`) REFERENCES `cadastro` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela entrelacos.login: ~0 rows (aproximadamente)
DELETE FROM `login`;

-- Copiando estrutura para tabela entrelacos.necessidades
DROP TABLE IF EXISTS `necessidades`;
CREATE TABLE IF NOT EXISTS `necessidades` (
  `id_necessidade` int(11) NOT NULL AUTO_INCREMENT,
  `id_animal` int(11) DEFAULT NULL,
  `nome` varchar(100) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `grau_importancia` varchar(50) DEFAULT NULL,
  `descricao` text DEFAULT NULL,
  `botao` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_necessidade`),
  KEY `id_animal` (`id_animal`),
  CONSTRAINT `necessidades_ibfk_1` FOREIGN KEY (`id_animal`) REFERENCES `animais` (`id_animal`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela entrelacos.necessidades: ~0 rows (aproximadamente)
DELETE FROM `necessidades`;

-- Copiando estrutura para tabela entrelacos.ong
DROP TABLE IF EXISTS `ong`;
CREATE TABLE IF NOT EXISTS `ong` (
  `id_ong` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `nome` varchar(200) NOT NULL,
  `email` varchar(200) NOT NULL,
  `telefone` varchar(20) NOT NULL,
  `endereco` varchar(200) NOT NULL,
  `cnpj` varchar(50) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `estado` char(2) NOT NULL,
  `pix` varchar(256) DEFAULT NULL,
  `trabalho_ofe` text NOT NULL,
  PRIMARY KEY (`id_ong`),
  KEY `fk_ong_usuario` (`id_usuario`),
  CONSTRAINT `fk_ong_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `cadastro` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela entrelacos.ong: ~0 rows (aproximadamente)
DELETE FROM `ong`;

-- Copiando estrutura para tabela entrelacos.usuario_ong
DROP TABLE IF EXISTS `usuario_ong`;
CREATE TABLE IF NOT EXISTS `usuario_ong` (
  `id_usuario` int(11) NOT NULL,
  `id_ong` int(11) NOT NULL,
  PRIMARY KEY (`id_usuario`,`id_ong`),
  KEY `fk_ong` (`id_ong`),
  CONSTRAINT `fk_ong` FOREIGN KEY (`id_ong`) REFERENCES `ong` (`id_ong`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `cadastro` (`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- Copiando dados para a tabela entrelacos.usuario_ong: ~0 rows (aproximadamente)
DELETE FROM `usuario_ong`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
