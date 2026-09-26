const IDLE_MS = 4000;

// Dois motivos independentes para esconder a interface: ociosidade (volta com qualquer
// interação) e pedido do usuário (H ou toque na cena; só outro pedido a traz de volta).
export function createAutoHide({ canIdle, onChange }) {
  let idle = false;
  let hiddenByUser = false;
  let timer = null;

  const isHidden = () => idle || hiddenByUser;

  function update(wasHidden) {
    if (isHidden() !== wasHidden) onChange(isHidden());
  }

  function arm() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!canIdle()) {
        arm();
        return;
      }
      const wasHidden = isHidden();
      idle = true;
      update(wasHidden);
    }, IDLE_MS);
  }

  return {
    activity() {
      const wasHidden = isHidden();
      idle = false;
      update(wasHidden);
      arm();
    },
    toggle() {
      const wasHidden = isHidden();
      if (wasHidden) {
        idle = false;
        hiddenByUser = false;
      } else {
        hiddenByUser = true;
      }
      update(wasHidden);
      arm();
    },
  };
}
