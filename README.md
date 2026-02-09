# niks3-action

[![check](https://img.shields.io/github/actions/workflow/status/spotdemo4/niks3-action/check.yaml?branch=main&logo=github&logoColor=%23bac2de&label=check&labelColor=%23313244)](https://github.com/spotdemo4/niks3-action/actions/workflows/check.yaml/)
[![vulnerable](https://img.shields.io/github/actions/workflow/status/spotdemo4/niks3-action/vulnerable.yaml?branch=main&logo=github&logoColor=%23bac2de&label=vulnerable&labelColor=%23313244)](https://github.com/spotdemo4/niks3-action/actions/workflows/vulnerable.yaml)
[![nix](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fspotdemo4%2Fniks3-action%2Frefs%2Fheads%2Fmain%2Fflake.lock&query=%24.nodes.nixpkgs.original.ref&logo=nixos&logoColor=%23bac2de&label=channel&labelColor=%23313244&color=%234d6fb7)](https://nixos.org/)
[![node](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fspotdemo4%2Fniks3-action%2Frefs%2Fheads%2Fmain%2Fpackage.json&query=%24.engines.node&logo=nodedotjs&logoColor=%23bac2de&label=version&labelColor=%23313244&color=%23339933)](https://nodejs.org/en/about/previous-releases)

Pushes built [Nix](https://nixos.org/) packages to a binary cache with [Niks3](https://github.com/Mic92/niks3)

## Usage

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v6
      - uses: DeterminateSystems/determinate-nix-action@main

      - name: Setup niks3 cache
        uses: spotdemo4/niks3-action@v0.0.1
        with:
          server-url: https://niks3.trev.zip
          auth-token: ${{ secrets.NIKS3_TOKEN }}

      - run: nix build .
```

### [OIDC](https://github.com/Mic92/niks3/wiki/OIDC) authentication

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write # Required for OIDC
    steps:
      - uses: actions/checkout@v6
      - uses: DeterminateSystems/determinate-nix-action@main

      - name: Setup niks3 cache
        uses: spotdemo4/niks3-action@v0.0.1
        with:
          audience: https://niks3.trev.zip

      - run: nix build .
```

## Inputs

### `server-url`

Niks3 server URL for authentication

### `auth-token`

Niks3 authentication token for authentication

### `audience`

Niks3 audience for OIDC authentication

### `inputs-from`

Override the flake inputs of `github:Mic92/niks3`
