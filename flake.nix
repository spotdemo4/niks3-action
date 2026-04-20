{
  description = "niks3 action";

  nixConfig = {
    extra-substituters = [
      "https://nix.trev.zip"
    ];
    extra-trusted-public-keys = [
      "trev:I39N/EsnHkvfmsbx8RUW+ia5dOzojTQNCTzKYij1chU="
    ];
  };

  inputs = {
    systems.url = "github:nix-systems/default";
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    trev = {
      url = "github:spotdemo4/nur";
      inputs.systems.follows = "systems";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      trev,
      ...
    }:
    trev.libs.mkFlake (
      system: pkgs: {
        devShells = {
          default = pkgs.mkShell {
            shellHook = pkgs.shellhook.ref;
            packages = with pkgs; [
              # node
              nodejs_24

              # lint
              biome
              nixfmt
              prettier

              # util
              bumper
              flake-release
            ];
          };

          bump = pkgs.mkShell {
            name = "bump";
            packages = with pkgs; [
              bumper
            ];
          };

          release = pkgs.mkShell {
            name = "release";
            packages = with pkgs; [
              flake-release
            ];
          };

          update = pkgs.mkShell {
            name = "update";
            packages = with pkgs; [
              renovate
              nodejs_24 # npm run build
            ];
          };

          vulnerable = pkgs.mkShell {
            name = "vulnerable";
            packages = with pkgs; [
              nodejs_24 # node
              flake-checker # flake
              zizmor # actions
            ];
          };
        };

        checks = pkgs.mkChecks {
          biome = {
            root = ./.;
            filter = file: file.hasExt "ts" || file.hasExt "json";
            include = ./.gitignore;
            ignore = ./dist;
            packages = with pkgs; [
              biome
            ];
            script = ''
              biome ci
            '';
          };

          actions = {
            root = ./.;
            files = [
              ./action.yaml
              ./.github/workflows
            ];
            packages = with pkgs; [
              action-validator
              zizmor
            ];
            forEach = ''
              action-validator "$file"
              zizmor "$file"
            '';
          };

          renovate = {
            root = ./.github;
            files = ./.github/renovate.json;
            packages = with pkgs; [
              renovate
            ];
            script = ''
              renovate-config-validator renovate.json
            '';
          };

          nix = {
            root = ./.;
            filter = file: file.hasExt "nix";
            packages = with pkgs; [
              nixfmt
            ];
            forEach = ''
              nixfmt --check "$file"
            '';
          };

          prettier = {
            root = ./.;
            filter = file: file.hasExt "yaml" || file.hasExt "md";
            packages = with pkgs; [
              prettier
            ];
            forEach = ''
              prettier --check "$file"
            '';
          };
        };

        formatter = pkgs.treefmt.withConfig {
          configFile = ./treefmt.toml;
          runtimeInputs = with pkgs; [
            biome
            nixfmt
            prettier
          ];
        };
      }
    );
}
