
const API_VACCINE_DETAIL = "http://localhost:3000/api/vaccine";
const SERVER_VACCINE = "http://localhost:3000";

const params = new URLSearchParams(window.location.search);
const vaccineId = Number(params.get("id"));

const loadingElement = document.getElementById("vaccineLoading");
const errorElement = document.getElementById("vaccineError");
const contentElement = document.getElementById("vaccineContent");

function setVaccineText(id, value, fallback = "Đang cập nhật") {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value || fallback;
    }
}

function showVaccineError(message) {
    loadingElement.hidden = true;
    contentElement.hidden = true;

    errorElement.textContent = message;
    errorElement.hidden = false;
}

function getVaccineDetailImage(path) {
    if (!path) return "";

    const cleanPath = String(path).replace(/^\/+/, "");

    if (!cleanPath.startsWith("uploads/vaccine/")) {
        return "";
    }

    return `${SERVER_VACCINE}/${cleanPath}`;
}

function getAudienceLabel(value) {
    switch (value) {
        case "TRE_EM":
            return "Trẻ em";

        case "NGUOI_LON":
            return "Người lớn";

        case "CA_HAI":
            return "Trẻ em và người lớn";

        default:
            return "Đang cập nhật";
    }
}

function renderVaccineDetail(vaccine) {
    setVaccineText("vaccineName", vaccine.ten_vaccine);
    setVaccineText("breadcrumbVaccine", vaccine.ten_vaccine);

    setVaccineText(
        "vaccineDescription",
        vaccine.mo_ta,
        "Chưa có mô tả vaccine."
    );

    setVaccineText("vaccineDisease", vaccine.phong_benh);

    setVaccineText(
        "vaccineAudience",
        getAudienceLabel(vaccine.loai_doi_tuong)
    );

    setVaccineText("vaccineCountry", vaccine.nuoc_sx);
    setVaccineText("vaccineSupplier", vaccine.nha_cung_cap);

    setVaccineText(
        "vaccineDetail",
        vaccine.noi_dung_chi_tiet,
        "Chưa có thông tin chi tiết."
    );

    setVaccineText(
        "vaccineSource",
        vaccine.nguon_tham_khao,
        "Chưa có nguồn tham khảo."
    );

    const statusElement = document.getElementById("vaccineStatus");

    const statusMap = {
        CON: {
            text: "Còn hàng",
            className: "status-con"
        },
        HET: {
            text: "Hết hàng",
            className: "status-het"
        },
        NGUNG: {
            text: "Ngừng sử dụng",
            className: "status-ngung"
        }
    };

    const status = statusMap[vaccine.trang_thai] || {
        text: "Đang cập nhật",
        className: ""
    };

    statusElement.textContent = status.text;
    statusElement.className = `status-badge ${status.className}`;

    const image = document.getElementById("vaccineImage");
    const placeholder = document.getElementById("vaccineImagePlaceholder");

    const imageUrl = getVaccineDetailImage(vaccine.hinh_anh);

    if (imageUrl) {
        image.onload = () => {
            image.hidden = false;
            placeholder.hidden = true;
        };

        image.onerror = () => {
            image.hidden = true;
            placeholder.hidden = false;
        };

        image.src = imageUrl;
        image.alt = vaccine.ten_vaccine || "Hình ảnh vaccine";
    } else {
        image.hidden = true;
        placeholder.hidden = false;
    }

    document.title =
        `${vaccine.ten_vaccine || "Chi tiết vaccine"} - VAX AI`;

    loadingElement.hidden = true;
    errorElement.hidden = true;
    contentElement.hidden = false;
}

async function loadVaccineDetail() {
    if (!Number.isInteger(vaccineId) || vaccineId <= 0) {
        showVaccineError("Mã vaccine không hợp lệ.");
        return;
    }

    try {
        const response = await fetch(
            `${API_VACCINE_DETAIL}/${vaccineId}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Không tìm thấy thông tin vaccine."
            );
        }
        const vaccine = data;

        if (!vaccine || Number(vaccine.id) !== vaccineId) {
            throw new Error("Dữ liệu vaccine không hợp lệ.");
        }

        if (vaccine.trang_thai === "NGUNG") {
            showVaccineError(
                "Vaccine này hiện không còn được giới thiệu."
            );
            return;
        }

        renderVaccineDetail(vaccine);

    } catch (error) {
        console.error("Lỗi tải chi tiết vaccine:", error);
        showVaccineError(error.message);
    }
}

loadVaccineDetail();
