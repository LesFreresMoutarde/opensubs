import {Modal, Spinner} from "react-bootstrap";

interface OpenSubsConfirmationWithdrawModalProps {
    showModal: boolean,
    closeModal: () => void,

    withdraw: () => void,
}
function OpenSubsConfirmationWithdrawModal({showModal, closeModal, withdraw}: OpenSubsConfirmationWithdrawModalProps) {
    return (
        <Modal
            show={showModal}
            onHide={closeModal}
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    Withdraw confirmation
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                    <p>There will be as many transactions as there are platforms where you have funds</p>
            </Modal.Body>
            <Modal.Footer>
                <div className="d-flex justify-content-between w-100">
                    <div>
                        <button className="btn btn-primary" onClick={withdraw}>Withdraw</button>
                    </div>
                    <div>
                        <button className="btn btn-danger" onClick={closeModal}>Close</button>
                    </div>
                </div>
            </Modal.Footer>
        </Modal>
    )
}

export default OpenSubsConfirmationWithdrawModal;