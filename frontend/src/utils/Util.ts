import Swal from 'sweetalert2';

function shortenAddress(address: string, firstCharactersCount: number = 3, lastCharactersCount: number = 3): string {
    if (!address.startsWith("0x")) {
        return address;
    }

    const firstCharacters = address.slice(0, firstCharactersCount + 2);
    const lastCharacters = address.slice(lastCharactersCount * -1);

    return firstCharacters + "…" + lastCharacters;
}

type toastType = "success" | "error" | "warning"

function fireToast(type: toastType, text: string) {
    const bgColor: {[key: string]: string} = {success: '#28a745', error: '#dc3545', warning: '#ffc107'};

    const textColor = {success: 'white', error: 'white', warning: '#343a40'};

    Swal.fire({
        title: text,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: bgColor[type],
        color: textColor[type]
    });
}

export {shortenAddress, fireToast}
