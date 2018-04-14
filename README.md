# Jupyter Clipboard

Use Jupyter's Comm mechanism to copy remote content to a local clipboard. Useful if you're running Jupyterhub!


## Installing (Live)

- `jupyter nbextension install --sys-prefix https://github.com/njwhite/jupyter-clipboard/archive/master.tar.gz`
- `jupyter nbextension enable --sys-prefix jupyter-clipboard-master/jupyter-clipboard/main`

## Installing (Dev)

Run (from the root of this repo)

- `jupyter nbextension install --symlink --sys-prefix jupyter-clipboard`
- `jupyter nbextension enable jupyter-clipboard/main --sys-prefix`

