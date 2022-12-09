import {Modal, Spinner} from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.css';
interface LoadingModalProps {
    showModal: boolean,
    closeModal: () => void,
}
function LoadingModal({showModal, closeModal}: LoadingModalProps) {
    return (
        <Modal
            show={showModal}
            onHide={closeModal}
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    Transaction in progress
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex justify-content-center">
                    <Spinner animation="border"></Spinner>
                </div>
                <div className="mt-3">
                    <p>This popup will close automatically when transaction has been completed</p>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button className="btn btn-primary" onClick={closeModal}>Close</button>
            </Modal.Footer>
        </Modal>
    )
}

export default LoadingModal;