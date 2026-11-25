const PAYMENT_API_URL =
    "http://localhost:3000/api/thanh-toan/admin";

const REFUND_API_URL =
    "http://localhost:3000/api/hoan-tien";

const paymentBody =
    document.getElementById("paymentBody");

const filterStatus =
    document.getElementById("filterStatus");

const filterMethod =
    document.getElementById("filterMethod");

const filterRefundStatus =
    document.getElementById("filterRefundStatus");

const filterKeyword =
    document.getElementById("filterKeyword");

const btnReload =
    document.getElementById("btnReload");

const refundModal =
    document.getElementById("refundModal");

const refundModalTitle =
    document.getElementById("refundModalTitle");

const btnCloseRefundModal =
    document.getElementById("btnCloseRefundModal");

const btnModalClose =
    document.getElementById("btnModalClose");

const btnRejectRefund =
    document.getElementById("btnRejectRefund");

const btnConfirmRefund =
    document.getElementById("btnConfirmRefund");

const detailCustomerName =
    document.getElementById("detailCustomerName");

const detailUsername =
    document.getElementById("detailUsername");

const detailPhone =
    document.getElementById("detailPhone");

const detailEmail =
    document.getElementById("detailEmail");

const detailAppointmentId =
    document.getElementById("detailAppointmentId");

const detailVaccine =
    document.getElementById("detailVaccine");

const detailAppointmentDate =
    document.getElementById("detailAppointmentDate");

const detailAppointmentTime =
    document.getElementById("detailAppointmentTime");

const detailAmount =
    document.getElementById("detailAmount");

const detailPaymentMethod =
    document.getElementById("detailPaymentMethod");

const detailTransactionCode =
    document.getElementById("detailTransactionCode");

const detailPaymentDate =
    document.getElementById("detailPaymentDate");

const detailPaymentStatus =
    document.getElementById("detailPaymentStatus");

const noRefundMessage =
    document.getElementById("noRefundMessage");

const refundDetailContent =
    document.getElementById("refundDetailContent");

const detailRefundAmount =
    document.getElementById("detailRefundAmount");

const detailRefundRequestDate =
    document.getElementById("detailRefundRequestDate");

const detailRefundStatus =
    document.getElementById("detailRefundStatus");

const detailRefundProcessedDate =
    document.getElementById("detailRefundProcessedDate");

const detailRefundProcessor =
    document.getElementById("detailRefundProcessor");

const detailRefundRequester =
    document.getElementById("detailRefundRequester");

const detailRefundTransactionCode =

    document.getElementById(
        "detailRefundTransactionCode"
    );

const detailRefundReason =
    document.getElementById("detailRefundReason");

const adminNoteInputGroup =
    document.getElementById("adminNoteInputGroup");

const adminNoteDisplayGroup =
    document.getElementById("adminNoteDisplayGroup");

const refundAdminNote =
    document.getElementById("refundAdminNote");

const detailAdminNote =
    document.getElementById("detailAdminNote");

let payments = [];

let currentPayment = null;

let currentRefundId = null;

let isProcessingRefund = false;

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadPayments();

        if (btnReload) {

            btnReload.addEventListener(
                "click",
                loadPayments
            );

        }

        if (filterStatus) {

            filterStatus.addEventListener(
                "change",
                renderPayments
            );

        }

        if (filterMethod) {

            filterMethod.addEventListener(
                "change",
                renderPayments
            );

        }

        if (filterRefundStatus) {

            filterRefundStatus.addEventListener(
                "change",
                renderPayments
            );

        }

        if (filterKeyword) {

            filterKeyword.addEventListener(
                "input",
                renderPayments
            );

        }

        if (btnCloseRefundModal) {

            btnCloseRefundModal.addEventListener(
                "click",
                closeRefundModal
            );

        }

        if (btnModalClose) {

            btnModalClose.addEventListener(
                "click",
                closeRefundModal
            );

        }

        if (refundModal) {

            refundModal.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target === refundModal &&
                        !isProcessingRefund
                    ) {

                        closeRefundModal();

                    }

                }
            );

        }

        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Escape" &&
                    refundModal?.classList.contains("show") &&
                    !isProcessingRefund
                ) {

                    closeRefundModal();

                }

            }
        );

        if (btnRejectRefund) {

            btnRejectRefund.addEventListener(
                "click",
                rejectRefund
            );

        }

        if (btnConfirmRefund) {

            btnConfirmRefund.addEventListener(
                "click",
                confirmRefund
            );

        }

    }
);

function getCurrentUser() {

    try {

        const raw =
            localStorage.getItem("user");


        if (!raw) {

            return null;

        }

        return JSON.parse(raw);

    } catch (err) {

        console.error(
            "Không đọc được thông tin người dùng:",
            err
        );

        return null;

    }

}

function getAdminHeaders(includeContentType = false) {
    const headers = {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`
    };

    if (includeContentType) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

function validateAdminLogin() {

    const user =
        getCurrentUser();


    if (!user || !localStorage.getItem("token")) {

        alert(
            "Không tìm thấy thông tin đăng nhập."
        );

        return false;

    }

    const role =
        user.vai_tro ||
        user.role ||
        "";


    if (role !== "ADMIN") {

        alert(
            "Bạn không có quyền thực hiện chức năng này."
        );

        return false;

    }

    return true;

}

async function loadPayments() {

    if (!paymentBody) {

        return;

    }

    try {

        paymentBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-row"
                >
                    Đang tải dữ liệu...
                </td>
            </tr>
        `;

        const response =
            await fetch(
                PAYMENT_API_URL,
                {
                    method: "GET",

                    headers:
                        getAdminHeaders(false)
                }
            );

        const result =
            await readJsonResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Không thể tải danh sách thanh toán"
            );

        }

        if (Array.isArray(result)) {

            payments = result;

        } else if (
            Array.isArray(result.data)
        ) {

            payments =
                result.data;

        } else {

            payments = [];

        }

        renderPayments();

    } catch (err) {

        console.error(
            "Lỗi tải danh sách thanh toán:",
            err
        );

        paymentBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-row"
                >
                    ${escapeHtml(
            err.message ||
            "Lỗi tải dữ liệu thanh toán"
        )}
                </td>
            </tr>
        `;

    }

}

function renderPayments() {

    if (!paymentBody) {

        return;

    }

    const status =
        filterStatus?.value ||
        "ALL";

    const method =
        filterMethod?.value ||
        "ALL";

    const refundStatusFilter =
        filterRefundStatus?.value ||
        "ALL";

    const keyword =
        (
            filterKeyword?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const filtered =
        payments.filter(
            (item) => {

                const paymentStatus =
                    getPaymentStatus(item);

                const refundStatus =
                    getRefundStatus(item);

                const matchStatus =
                    status === "ALL" ||
                    paymentStatus === status;

                const matchMethod =
                    method === "ALL" ||
                    item.phuong_thuc === method;

                let matchRefund = true;


                if (
                    refundStatusFilter === "NONE"
                ) {

                    matchRefund =
                        !refundStatus;

                } else if (
                    refundStatusFilter !== "ALL"
                ) {

                    matchRefund =
                        refundStatus ===
                        refundStatusFilter;

                }

                const searchText = `
                    ${item.ten_khach_hang || ""}
                    ${item.ho_ten || ""}
                    ${item.ten_dang_nhap || ""}
                    ${item.so_dien_thoai || ""}
                    ${item.email_nguoi_tiem || ""}
                    ${item.ma_giao_dich || ""}
                    ${item.ma_giao_dich_vnpay || ""}
                    ${item.ma_tham_chieu_vnpay || ""}
                    ${item.ma_giao_dich_hoan || ""}
                    ${item.vaccine || ""}
                    ${item.ly_do_hoan_tien || ""}
                    ${item.ly_do || ""}
                `.toLowerCase();

                const matchKeyword =
                    !keyword ||
                    searchText.includes(
                        keyword
                    );

                return (
                    matchStatus &&
                    matchMethod &&
                    matchRefund &&
                    matchKeyword
                );

            }
        );

    if (
        filtered.length === 0
    ) {

        paymentBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-row"
                >
                    Không có dữ liệu thanh toán
                </td>
            </tr>
        `;

        return;

    }

    paymentBody.innerHTML =
        filtered
            .map(
                (item, index) => {

                    const paymentStatus =
                        getPaymentStatus(
                            item
                        );

                    const refundStatus =
                        getRefundStatus(
                            item
                        );

                    const paymentId =
                        getPaymentId(
                            item
                        );


                    return `
    <tr>
        <!-- STT -->
        <td data-label="STT" class="text-center">
            ${index + 1}
        </td>

        <!-- KHÁCH HÀNG -->
        <td
            data-label="Khách hàng"
            title="${escapeHtml(getCustomerName(item))}"
        >
            ${escapeHtml(getCustomerName(item))}
        </td>

        <!-- LỊCH TIÊM -->
        <td data-label="Lịch tiêm">
            <div class="appointment-cell">
                <span class="appointment-date">
                    ${escapeHtml(formatDate(item.ngay_tiem))}
                </span>

                <span class="appointment-time">
                    ${escapeHtml(formatTime(item.gio_tiem))}
                </span>
            </div>
        </td>

        <!-- SỐ TIỀN -->
        <td data-label="Số tiền" class="money">
            ${escapeHtml(formatMoney(item.so_tien))}
        </td>

        <!-- PHƯƠNG THỨC -->
        <td data-label="Phương thức" class="text-center">
            ${escapeHtml(formatMethod(item.phuong_thuc))}
        </td>

        <!-- THANH TOÁN -->
        <td data-label="Thanh toán" class="text-center">
            ${renderPaymentStatus(paymentStatus)}
        </td>

        <!-- HOÀN TIỀN -->
        <td data-label="Hoàn tiền" class="text-center">
            ${renderRefundStatus(refundStatus)}
        </td>

        <!-- THAO TÁC -->
        <td data-label="Thao tác" class="text-center">
            <div class="action-group">
                ${refundStatus === "CHO_XU_LY"
                            ? `
                            <button
                                type="button"
                                class="btn btn-process"
                                data-payment-id="${escapeHtml(paymentId)}"
                            >
                                Xử lý
                            </button>
                        `
                            : `
                            <button
                                type="button"
                                class="btn btn-view"
                                data-payment-id="${escapeHtml(paymentId)}"
                            >
                                Xem
                            </button>
                        `
                        }
            </div>
        </td>
    </tr>
`;

                }
            )
            .join("");

    bindTableActionEvents();

}

function bindTableActionEvents() {

    const buttons =
        paymentBody.querySelectorAll(
            "[data-payment-id]"
        );

    buttons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const paymentId =
                        button.dataset.paymentId;


                    openPaymentDetailById(
                        paymentId
                    );

                }
            );

        }
    );

}

function openPaymentDetailById(
    paymentId
) {

    const item =
        payments.find(
            (payment) => {

                return (
                    String(
                        getPaymentId(
                            payment
                        )
                    ) ===
                    String(
                        paymentId
                    )
                );

            }
        );


    if (!item) {

        alert(
            "Không tìm thấy thông tin giao dịch."
        );

        return;

    }

    openPaymentDetail(
        item
    );

}

function openPaymentDetail(item) {

    currentPayment =
        item;


    currentRefundId =
        getRefundId(
            item
        );


    const paymentStatus =
        getPaymentStatus(
            item
        );


    const refundStatus =
        getRefundStatus(
            item
        );

    if (refundModalTitle) {

        refundModalTitle.textContent =
            refundStatus === "CHO_XU_LY"
                ? "Xử lý yêu cầu hoàn tiền"
                : "Chi tiết thanh toán";

    }

    setText(
        detailCustomerName,
        getCustomerName(item)
    );

    setText(
        detailUsername,
        item.ten_dang_nhap ||
        "Không có"
    );

    setText(
        detailPhone,
        item.so_dien_thoai ||
        "Không có"
    );

    setText(
        detailEmail,
        item.email_nguoi_tiem ||
        item.email ||
        "Không có"
    );

    setText(
        detailAppointmentId,
        item.lich_tiem_id
            ? `#${item.lich_tiem_id}`
            : "Không có"
    );

    setText(
        detailVaccine,
        item.vaccine ||
        "Không có"
    );

    setText(
        detailAppointmentDate,
        formatDate(
            item.ngay_tiem
        )
    );

    setText(
        detailAppointmentTime,
        formatTime(
            item.gio_tiem
        )
    );

    setText(
        detailAmount,
        formatMoney(
            item.so_tien
        )
    );

    setText(
        detailPaymentMethod,
        formatMethod(
            item.phuong_thuc
        )
    );

    setText(
        detailTransactionCode,
        getTransactionCode(
            item
        )
    );

    setText(
        detailPaymentDate,
        formatPaymentDateTime(
            item.ngay_thanh_toan
        )
    );

    if (detailPaymentStatus) {

        detailPaymentStatus.innerHTML =
            renderPaymentStatus(
                paymentStatus
            );

    }

    if (!refundStatus) {

        if (noRefundMessage) {

            noRefundMessage.style.display =
                "block";

        }

        if (refundDetailContent) {

            refundDetailContent.style.display =
                "none";

        }

        hideRefundActions();

        openRefundModal();

        return;

    }

    if (noRefundMessage) {

        noRefundMessage.style.display =
            "none";

    }

    if (refundDetailContent) {

        refundDetailContent.style.display =
            "block";

    }

    setText(
        detailRefundAmount,
        formatMoney(
            getRefundAmount(
                item
            )
        )
    );

    setText(
        detailRefundRequestDate,
        formatDateTime(
            getRefundRequestDate(
                item
            )
        )
    );

    if (detailRefundStatus) {

        detailRefundStatus.innerHTML =
            renderRefundStatus(
                refundStatus
            );

    }

    setText(
        detailRefundProcessedDate,
        getRefundProcessedDate(item)
            ? formatDateTime(
                getRefundProcessedDate(
                    item
                )
            )
            : "Chưa xử lý"
    );

    setText(
        detailRefundProcessor,
        getRefundProcessor(item)
    );

    setText(
        detailRefundRequester,
        getRefundRequester(item)
    );

    setText(
        detailRefundTransactionCode,

        getRefundTransactionCode(
            item
        )
    );

    setText(
        detailRefundReason,
        getRefundReason(
            item
        )
    );

    if (
        refundStatus ===
        "CHO_XU_LY"
    ) {

        if (adminNoteInputGroup) {

            adminNoteInputGroup.style.display =
                "block";

        }

        if (adminNoteDisplayGroup) {

            adminNoteDisplayGroup.style.display =
                "none";

        }

        if (refundAdminNote) {

            refundAdminNote.value =
                "";

            refundAdminNote.disabled =
                false;

        }

        if (btnRejectRefund) {

            btnRejectRefund.style.display =
                "inline-flex";

        }

        if (btnConfirmRefund) {

            btnConfirmRefund.style.display =
                "inline-flex";

        }

    } else {

        if (adminNoteInputGroup) {

            adminNoteInputGroup.style.display =
                "none";

        }

        if (adminNoteDisplayGroup) {

            adminNoteDisplayGroup.style.display =
                "block";

        }

        setText(
            detailAdminNote,
            getAdminNote(
                item
            )
        );

        hideRefundActions();

    }

    openRefundModal();

}

function openRefundModal() {

    if (!refundModal) {

        return;

    }

    refundModal.classList.add(
        "show"
    );

    document.body.style.overflow =
        "hidden";

    const modalBody =
        refundModal.querySelector(
            ".modal-body"
        );

    if (modalBody) {

        modalBody.scrollTop = 0;

    }

}

function closeRefundModal() {

    if (
        !refundModal ||
        isProcessingRefund
    ) {

        return;

    }

    refundModal.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";

    currentPayment =
        null;

    currentRefundId =
        null;

    if (refundAdminNote) {

        refundAdminNote.value =
            "";

        refundAdminNote.disabled =
            false;

    }

    hideRefundActions();

}

function hideRefundActions() {

    if (btnRejectRefund) {

        btnRejectRefund.style.display =
            "none";

    }

    if (btnConfirmRefund) {

        btnConfirmRefund.style.display =
            "none";

    }

}

async function rejectRefund() {

    if (isProcessingRefund) {

        return;

    }

    if (!validateAdminLogin()) {

        return;

    }

    if (
        !currentPayment ||
        !currentRefundId
    ) {

        alert(
            "Không tìm thấy yêu cầu hoàn tiền."
        );

        return;

    }

    const refundStatus =
        getRefundStatus(
            currentPayment
        );

    if (
        refundStatus !==
        "CHO_XU_LY"
    ) {

        alert(
            "Yêu cầu hoàn tiền này đã được xử lý."
        );

        return;

    }

    const note =
        refundAdminNote?.value
            .trim() ||
        "";

    if (!note) {

        alert(
            "Vui lòng nhập ghi chú/lý do từ chối."
        );

        refundAdminNote?.focus();

        return;

    }

    const confirmed =
        confirm(
            "Bạn có chắc muốn từ chối yêu cầu hoàn tiền này?"
        );

    if (!confirmed) {

        return;

    }

    try {

        setRefundButtonsLoading(
            true
        );

        const response =
            await fetch(
                `${REFUND_API_URL}/${encodeURIComponent(
                    currentRefundId
                )}/tu-choi`,
                {
                    method: "PUT",

                    headers:
                        getAdminHeaders(
                            true
                        ),

                    body:
                        JSON.stringify({
                            ghi_chu_admin:
                                note
                        })
                }
            );

        const result =
            await readJsonResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Không thể từ chối yêu cầu hoàn tiền"
            );

        }

        alert(
            result.message ||
            "Đã từ chối yêu cầu hoàn tiền."
        );

        forceCloseRefundModal();

        await loadPayments();

    } catch (err) {

        console.error(
            "Lỗi từ chối hoàn tiền:",
            err
        );

        alert(
            err.message ||
            "Có lỗi xảy ra khi từ chối hoàn tiền."
        );

    } finally {

        setRefundButtonsLoading(
            false
        );

    }

}

async function confirmRefund() {

    if (isProcessingRefund) {

        return;

    }

    if (!validateAdminLogin()) {

        return;

    }

    if (
        !currentPayment ||
        !currentRefundId
    ) {

        alert(
            "Không tìm thấy yêu cầu hoàn tiền."
        );

        return;

    }

    const refundStatus =
        getRefundStatus(
            currentPayment
        );

    if (
        refundStatus !==
        "CHO_XU_LY"
    ) {

        alert(
            "Yêu cầu hoàn tiền này đã được xử lý."
        );

        return;

    }

    const note =
        refundAdminNote?.value
            .trim() ||
        "";

    const amount =
        formatMoney(
            getRefundAmount(
                currentPayment
            )
        );

    const customer =
        getCustomerName(
            currentPayment
        );

    const confirmed = confirm(
        `Xác nhận đã hoàn tiền ${amount} cho ${customer}?\n\n` +
        "Sau khi xác nhận, yêu cầu hoàn tiền sẽ được hoàn tất và lịch tiêm liên quan sẽ tự động hủy.\n\n" +
        "Bạn có chắc chắn muốn tiếp tục?"
    );

    if (!confirmed) {

        return;

    }

    try {

        setRefundButtonsLoading(
            true
        );

        const response =
            await fetch(
                `${REFUND_API_URL}/${encodeURIComponent(
                    currentRefundId
                )}/hoan-tien`,
                {
                    method: "PUT",

                    headers:
                        getAdminHeaders(
                            true
                        ),

                    body:
                        JSON.stringify({
                            ghi_chu_admin:
                                note
                        })
                }
            );

        const result =
            await readJsonResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Không thể xác nhận hoàn tiền"
            );

        }

        alert(
            result.message ||
            "Xác nhận hoàn tiền thành công."
        );

        forceCloseRefundModal();

        await loadPayments();

    } catch (err) {

        console.error(
            "Lỗi xác nhận hoàn tiền:",
            err
        );

        alert(
            err.message ||
            "Có lỗi xảy ra khi xác nhận hoàn tiền."
        );

    } finally {

        setRefundButtonsLoading(
            false
        );

    }

}

function setRefundButtonsLoading(
    loading
) {

    isProcessingRefund =
        loading;

    if (btnRejectRefund) {

        btnRejectRefund.disabled =
            loading;

    }

    if (btnConfirmRefund) {

        btnConfirmRefund.disabled =
            loading;

    }

    if (refundAdminNote) {

        refundAdminNote.disabled =
            loading;

    }

    if (btnCloseRefundModal) {

        btnCloseRefundModal.disabled =
            loading;

    }

    if (btnModalClose) {

        btnModalClose.disabled =
            loading;

    }

    if (loading) {

        if (btnRejectRefund) {

            btnRejectRefund.textContent =
                "Đang xử lý...";

        }

        if (btnConfirmRefund) {

            btnConfirmRefund.textContent =
                "Đang xử lý...";

        }

    } else {

        if (btnRejectRefund) {

            btnRejectRefund.textContent =
                "Từ chối";

        }

        if (btnConfirmRefund) {

            btnConfirmRefund.textContent =
                "Xác nhận hoàn tiền";

        }

    }

}

function forceCloseRefundModal() {

    if (!refundModal) {

        return;

    }

    refundModal.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";

    currentPayment =
        null;

    currentRefundId =
        null;

    if (refundAdminNote) {

        refundAdminNote.value =
            "";

    }

}

function getPaymentStatus(item) {
    const status =
        item?.trang_thai_thanh_toan ||
        item?.trang_thai ||
        "";
    if (status === "DA_HOAN_TIEN") {
        return "DA_THANH_TOAN";
    }

    return status;
}

function getRefundStatus(item) {

    return (
        item?.trang_thai_hoan_tien ||
        ""
    );

}

function getPaymentId(item) {

    return (
        item?.thanh_toan_id ||
        item?.id ||
        ""
    );

}

function getRefundId(item) {

    return (
        item?.hoan_tien_id ||
        null
    );

}

function getCustomerName(item) {

    return (
        item?.ten_khach_hang ||
        item?.ho_ten ||
        item?.ten_dang_nhap ||
        "Không có"
    );

}

function getRefundAmount(item) {

    if (
        item?.so_tien_hoan !== null &&
        item?.so_tien_hoan !== undefined
    ) {

        return item.so_tien_hoan;

    }


    return (
        item?.so_tien ||
        0
    );

}

function getRefundRequestDate(item) {

    return (
        item?.ngay_yeu_cau ||
        null
    );

}

function getRefundProcessedDate(item) {

    return (
        item?.ngay_xu_ly ||
        null
    );

}

function getRefundProcessor(item) {

    if (item?.ten_nguoi_xu_ly) {

        return item.ten_nguoi_xu_ly;

    }


    if (item?.nguoi_xu_ly_id) {

        return `#${item.nguoi_xu_ly_id}`;

    }


    return "Chưa xử lý";

}

function getRefundRequester(item) {
    if (!item?.hoan_tien_id) {
        return "Chưa có";
    }

    const username =
        String(item.ten_nguoi_yeu_cau || "").trim();

    const role = item.vai_tro_nguoi_yeu_cau;

    const roleMap = {
        KHACH_HANG: "Khách hàng",
        NHAN_VIEN_Y_TE: "Nhân viên y tế",
        ADMIN: "Admin"
    };

    const roleText = roleMap[role] || "";

    const requester =
        username ||
        (item.nguoi_yeu_cau_id
            ? `#${item.nguoi_yeu_cau_id}`
            : "Chưa xác định");

    return roleText
        ? `${requester} (${roleText})`
        : requester;
}

function getRefundTransactionCode(item) {

    return (
        item?.ma_giao_dich_hoan ||
        "Chưa có"
    );

}

function getRefundReason(item) {

    return (
        item?.ly_do_hoan_tien ||
        item?.ly_do ||
        "Không có"
    );

}

function getAdminNote(item) {

    const value =
        item?.ghi_chu_admin;

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        return "Không có";

    }

    return String(value);

}

function renderPaymentStatus(status) {

    const statusMap = {

        CHUA_THANH_TOAN: {
            className:
                "st-unpaid",

            text:
                "Chưa thanh toán"
        },

        DA_THANH_TOAN: {
            className:
                "st-paid",

            text:
                "Đã thanh toán"
        },

        THAT_BAI: {
            className:
                "st-failed",

            text:
                "Thất bại"
        },

        DA_HOAN_TIEN: {
            className:
                "st-refund",

            text:
                "Đã hoàn tiền"
        }

    };

    const config =
        statusMap[status] ||
        {
            className:
                "st-none",

            text:
                "Không rõ"
        };

    return `
        <span class="status-badge ${config.className}">
            ${config.text}
        </span>
    `;

}

function renderRefundStatus(status) {

    if (!status) {

        return `—`;

    }

    const statusMap = {

        CHO_XU_LY: {
            className:
                "st-refund-pending",

            text:
                "Chờ xử lý"
        },

        DA_HOAN_TIEN: {
            className:
                "st-refund",

            text:
                "Đã hoàn tiền"
        },

        TU_CHOI: {
            className:
                "st-refund-rejected",

            text:
                "Từ chối"
        }

    };

    const config =
        statusMap[status] ||
        {
            className:
                "st-none",

            text:
                "Không rõ"
        };

    return `
        <span class="status-badge ${config.className}">
            ${config.text}
        </span>
    `;

}

function formatMethod(method) {

    const methodMap = {

        VNPAY:
            "VNPAY",

        TIEN_MAT:
            "Tiền mặt"

    };

    return (
        methodMap[method] ||
        "Không rõ"
    );

}

function getTransactionCode(item) {

    return (
        item?.ma_giao_dich ||
        item?.ma_giao_dich_vnpay ||
        item?.ma_tham_chieu_vnpay ||
        "Không có"
    );

}

function formatMoney(value) {

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {

        return "0 ₫";

    }

    return (
        number.toLocaleString(
            "vi-VN"
        ) + " ₫"
    );

}

function formatDate(value) {

    if (!value) {

        return "Không có";

    }

    const match =
        String(value).match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

    if (match) {

        return (
            `${match[3]}/${match[2]}/${match[1]}`
        );

    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }

    return date.toLocaleDateString(
        "vi-VN",
        {
            timeZone:
                "Asia/Ho_Chi_Minh"
        }
    );

}

function formatTime(value) {

    if (!value) {

        return "Không có";

    }

    const text =
        String(value);

    if (
        /^\d{2}:\d{2}/.test(
            text
        )
    ) {

        return text.slice(
            0,
            5
        );

    }

    return text;

}

function formatPaymentDateTime(value) {

    if (!value) {

        return "Chưa thanh toán";

    }

    return formatDateTime(
        value
    );

}

function formatDateTime(value) {

    if (!value) {

        return "Không có";

    }

    let normalizedValue =
        String(value);

    if (
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/
            .test(normalizedValue)
    ) {

        normalizedValue =
            normalizedValue.replace(
                " ",
                "T"
            );

    }

    const date =
        new Date(
            normalizedValue
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }

    return date.toLocaleString(
        "vi-VN",
        {
            timeZone:
                "Asia/Ho_Chi_Minh",

            hour12:
                false
        }
    );

}

async function readJsonResponse(response) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        !contentType.includes(
            "application/json"
        )
    ) {

        let text = "";

        try {

            text =
                await response.text();

        } catch (_) {

            text = "";

        }

        console.error(
            "Response không phải JSON:",
            text
        );

        throw new Error(
            `Server trả về dữ liệu không hợp lệ (HTTP ${response.status})`
        );

    }

    return await response.json();

}

function setText(
    element,
    value
) {

    if (!element) {

        return;

    }

    element.textContent =
        value === null ||
            value === undefined ||
            value === ""

            ? "Không có"

            : String(value);

}

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}