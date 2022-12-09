import Swal from 'sweetalert2';
import {getStorage, ref, uploadString} from "firebase/storage";

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

interface SubscriptionMetadata {
    "description": string;
    "external_url": string;
    "image": string;
    "background_color": string;
    "level": string;
    "content_url": string;
}
async function pushMetadata(tokenId: number, platform: 'spooftify' | 'fakeflix') {
    const mappingData = {
        fakeflix: {
            label: 'Fakeflix',
            logo: 'https://firebasestorage.googleapis.com/v0/b/alyra-certification.appspot.com/o/logos%2Ffakeflix-logo.png?alt=media',
            url: process.env.REACT_APP_FAKEFLIX_URL
        },
        spooftify: {
            label: "Spooftify",
            logo: 'https://firebasestorage.googleapis.com/v0/b/alyra-certification.appspot.com/o/logos%2Fspooftify-logo.png?alt=media',
            url: process.env.REACT_APP_SPOOFTIFY_URL
        }
    }

    const storage = getStorage();

    const metadataRef = ref(storage, `metadata/${platform}/${tokenId}.json`);

    const metadata: SubscriptionMetadata = {
        description: `1 month subscription for ${mappingData[platform].label}`,
        external_url: `${process.env.REACT_APP_FIREBASE_MARKETPLACE_URL}/${tokenId}`,
        image: mappingData[platform].logo,
        background_color: '#000',
        level: 'standard',
        content_url: String(mappingData[platform].url)
    }

    await uploadString(metadataRef, JSON.stringify(metadata));
}

export {shortenAddress, fireToast, pushMetadata}
