{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";
    ww-node-overlays.url = "github:wunderwerkio/nix-node-packages-overlays";
  };

  outputs = {
    self,
    nixpkgs,
    ww-node-overlays,
  }: let
    forEachSystem = nixpkgs.lib.genAttrs [
      "x86_64-linux" "aarch64-linux"
      "x86_64-darwin" "aarch64-darwin"
    ];
  in {
    devShells = forEachSystem (
      system: let
        overlays = with ww-node-overlays.overlays; [
          pnpm
        ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };
      in rec {
        default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20

            nodePackages.pnpm-latest
          ];
        };
      }
    );

    formatter = forEachSystem (
      system:
        nixpkgs.legacyPackages.${system}.alejandra
    );
  };
}
