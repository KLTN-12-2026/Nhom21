
const db = require("../config/db");

// =====================================================
// 1. HÀM HỖ TRỢ
//
// Chuyển dữ liệu COUNT(*) từ MySQL sang Number.
// Giữ nguyên hàm toNumber của code gốc.
// =====================================================

function toNumber(value) {
    return Number(value || 0);
}


// =====================================================
// 2. TỔNG QUAN ADMIN
//
// Thống kê:
// - Tổng tài khoản.
// - Tổng vaccine.
// - Tổng cơ sở tiêm.
// - Tổng lịch tiêm.
// - Hoàn tiền đang chờ xử lý.
// =====================================================

async function getAdminOverview() {

    const [
        [userRows],
        [vaccineRows],
        [facilityRows],
        [scheduleRows],
        [refundRows]
    ] = await Promise.all([

        // =============================================
        // 2.1. TỔNG TÀI KHOẢN
        // =============================================

        db.query(`
            SELECT COUNT(*) AS total
            FROM nguoi_dung
        `),

        // =============================================
        // 2.2. TỔNG VACCINE
        // =============================================

        db.query(`
            SELECT COUNT(*) AS total
            FROM vaccine
        `),

        // =============================================
        // 2.3. TỔNG CƠ SỞ TIÊM
        // =============================================

        db.query(`
            SELECT COUNT(*) AS total
            FROM co_so_tiem
        `),

        // =============================================
        // 2.4. TỔNG LỊCH TIÊM
        // =============================================

        db.query(`
            SELECT COUNT(*) AS total
            FROM lich_tiem
        `),

        // =============================================
        // 2.5. HOÀN TIỀN CHỜ XỬ LÝ
        // =============================================

        db.query(`
            SELECT COUNT(*) AS total
            FROM hoan_tien
            WHERE trang_thai = 'CHO_XU_LY'
        `)
    ]);

    // ================================================
    // 2.6. TRẢ KẾT QUẢ ADMIN
    // ================================================

    return {
        tongTaiKhoan: toNumber(
            userRows[0]?.total
        ),

        tongVaccine: toNumber(
            vaccineRows[0]?.total
        ),

        tongCoSo: toNumber(
            facilityRows[0]?.total
        ),

        tongLichTiem: toNumber(
            scheduleRows[0]?.total
        ),

        hoanTienChoXuLy: toNumber(
            refundRows[0]?.total
        )
    };
}


// =====================================================
// 3. TỔNG QUAN NHÂN VIÊN Y TẾ
//
// Chỉ thống kê dữ liệu thuộc cơ sở được phân công.
// =====================================================

async function getStaffOverview(userId) {

    // ================================================
    // 3.1. LẤY CƠ SỞ ĐƯỢC PHÂN CÔNG
    // ================================================

    const [staffRows] = await db.query(
        `
        SELECT co_so_id
        FROM nhan_vien_y_te
        WHERE nguoi_dung_id = ?
        LIMIT 1
        `,
        [userId]
    );

    // ================================================
    // 3.2. KIỂM TRA PHÂN CÔNG CƠ SỞ
    // ================================================

    if (
        staffRows.length === 0 ||
        !staffRows[0].co_so_id
    ) {

        const error = new Error(
            "Nhân viên y tế chưa được phân công cơ sở tiêm"
        );

        error.status = 403;

        throw error;
    }

    const coSoId = staffRows[0].co_so_id;

    // ================================================
    // 3.3. TRUY VẤN THỐNG KÊ THEO CƠ SỞ
    // ================================================

    const [
        [todayRows],
        [pendingRows],
        [completedRows],
        [reminderRows]
    ] = await Promise.all([

        // =============================================
        // LỊCH TIÊM HÔM NAY
        // =============================================

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM lich_tiem
            WHERE co_so_id = ?
              AND ngay_tiem = CURDATE()
            `,
            [coSoId]
        ),

        // =============================================
        // LỊCH ĐANG CHỜ DUYỆT
        // =============================================

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM lich_tiem
            WHERE co_so_id = ?
              AND trang_thai = 'CHO_DUYET'
            `,
            [coSoId]
        ),

        // =============================================
        // HỒ SƠ ĐÃ GHI NHẬN TIÊM
        // =============================================

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM ho_so_tiem
            WHERE co_so_id = ?
            `,
            [coSoId]
        ),

        // =============================================
        // LƯỢT NHẮC LỊCH CHƯA GỬI
        // =============================================

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM nhac_lich_tiem n
            INNER JOIN lich_tiem l
                ON l.id = n.lich_tiem_id
            WHERE l.co_so_id = ?
              AND n.trang_thai = 'CHUA_GUI'
            `,
            [coSoId]
        )
    ]);

    // ================================================
    // 3.4. TRẢ KẾT QUẢ NHÂN VIÊN Y TẾ
    // ================================================

    return {
        lichHomNay: toNumber(
            todayRows[0]?.total
        ),

        lichChoXuLy: toNumber(
            pendingRows[0]?.total
        ),

        lichHoanThanh: toNumber(
            completedRows[0]?.total
        ),

        lichCanNhac: toNumber(
            reminderRows[0]?.total
        )
    };
}


// =====================================================
// 4. TỔNG QUAN KHÁCH HÀNG
//
// Chỉ thống kê dữ liệu của người dùng hiện tại.
// =====================================================

async function getCustomerOverview(userId) {

    const [
        [upcomingRows],
        [injectedRows],
        [historyRows]
    ] = await Promise.all([

        // =============================================
        // 4.1. LỊCH TIÊM SẮP TỚI
        // =============================================

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM lich_tiem
            WHERE nguoi_dung_id = ?
              AND (
                    ngay_tiem > CURDATE()
                    OR (
                        ngay_tiem = CURDATE()
                        AND gio_tiem >= CURTIME()
                    )
              )
              AND trang_thai IN (
                  'CHO_DUYET',
                  'DA_DUYET'
              )
            `,
            [userId]
        ),

        // =============================================
        // 4.2. SỐ HỒ SƠ MŨI TIÊM ĐÃ GHI NHẬN
        // =============================================

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM ho_so_tiem
            WHERE nguoi_dung_id = ?
            `,
            [userId]
        ),

        // =============================================
        // 4.3. TỔNG BẢN GHI LỊCH SỬ TIÊM
        // =============================================

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM ho_so_tiem
            WHERE nguoi_dung_id = ?
            `,
            [userId]
        )
    ]);

    // ================================================
    // 4.4. TRẢ KẾT QUẢ KHÁCH HÀNG
    // ================================================

    return {
        lichSapToi: toNumber(
            upcomingRows[0]?.total
        ),

        muiDaTiem: toNumber(
            injectedRows[0]?.total
        ),

        tongLichSuTiem: toNumber(
            historyRows[0]?.total
        )
    };
}


// =====================================================
// 5. EXPORT SERVICE
// =====================================================

module.exports = {
    getAdminOverview,
    getStaffOverview,
    getCustomerOverview
};
