# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2022-06-10
### Added
### Changed
- removed calls to EBSI4Austria/DanubeTech Services (in thoses docker containers)
- only TU Graz VCs and two WU Vienna VCs validate (regardless of VC creation date and JWT)
- VC parsing on paste (textarea input event)

## [0.1.0] - 2022-01-17
### Added
- get student DID from CHAPI wallet
- store new VC in CHAPI wallet
- retrieve VC from CHAPI wallet
