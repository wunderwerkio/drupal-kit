{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
    ww-node-overlays.url = "github:wunderwerkio/nix-node-packages-overlays";
    ww-utils.url = "github:wunderwerkio/nix-ww-utils";
  };

  outputs = {
    self,
    nixpkgs,
    ww-node-overlays,
    ww-utils,
  }: {
    devShells = ww-utils.lib.forEachWunderwerkSystem (
      system: let
        overlays = with ww-node-overlays.overlays; [
          pnpm
          vercel
        ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };
      in rec {
        default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs-18_x

            nodePackages.pnpm-latest
          ];
        };
      }
    );

    formatter = ww-utils.lib.forEachWunderwerkSystem (
      system:
        nixpkgs.legacyPackages.${system}.alejandra
    );
  };
}
