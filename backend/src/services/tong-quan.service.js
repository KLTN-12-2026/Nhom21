const db = require("../config/db");

function toNumber(value) {
    return Number(value || 0);
}


async function getAdminOverview() {

    const [
        [userRows],
        [vaccineRows],
        [facilityRows],
        [scheduleRows],
        [refundRows]
    ] = await Promise.all([

        db.query(`
            SELECT COUNT(*) AS total
            FROM nguoi_dung
        `),

        db.query(`
            SELECT COUNT(*) AS total
            FROM vaccine
        `),

        db.query(`
            SELECT COUNT(*) AS total
            FROM co_so_tiem
        `),

        db.query(`
            SELECT COUNT(*) AS total
            FROM lich_tiem
        `),


        db.query(`
            SELECT COUNT(*) AS total
            FROM hoan_tien
            WHERE trang_thai = 'CHO_XU_LY'
        `)
    ]);

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


async function getStaffOverview(userId) {

    const [staffRows] = await db.query(
        `
        SELECT co_so_id
        FROM nhan_vien_y_te
        WHERE nguoi_dung_id = ?
        LIMIT 1
        `,
        [userId]
    );

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

    const [
        [todayRows],
        [pendingRows],
        [completedRows],
        [reminderRows]
    ] = await Promise.all([

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM lich_tiem
            WHERE co_so_id = ?
              AND ngay_tiem = CURDATE()
            `,
            [coSoId]
        ),

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM lich_tiem
            WHERE co_so_id = ?
              AND trang_thai = 'CHO_DUYET'
            `,
            [coSoId]
        ),

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM ho_so_tiem
            WHERE co_so_id = ?
            `,
            [coSoId]
        ),

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

async function getCustomerOverview(userId) {

    const [
        [upcomingRows],
        [injectedRows],
        [historyRows],
        [paymentRows],
        [nearestRows]
    ] = await Promise.all([

        // 1. LỊCH TIÊM SẮP TỚI
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

        // 2. MŨI ĐÃ TIÊM
        db.query(
            `
            SELECT COUNT(*) AS total
            FROM ho_so_tiem
            WHERE nguoi_dung_id = ?
            `,
            [userId]
        ),

        // 3. LỊCH SỬ TIÊM
        db.query(
            `
            SELECT COUNT(*) AS total
            FROM ho_so_tiem
            WHERE nguoi_dung_id = ?
            `,
            [userId]
        ),

        // 4. THANH TOÁN CHỜ XỬ LÝ
        db.query(
            `
            SELECT COUNT(*) AS total
            FROM thanh_toan t
            INNER JOIN lich_tiem l
                ON l.id = t.lich_tiem_id
            WHERE t.nguoi_dung_id = ?
              AND l.nguoi_dung_id = ?
              AND t.trang_thai = 'CHUA_THANH_TOAN'
              AND l.trang_thai <> 'DA_HUY'
            `,
            [userId, userId]
        ),

        // 5. LỊCH TIÊM GẦN NHẤT
        db.query(
            `
            SELECT
                lt.id,
                lt.vaccine_id,
                v.ten_vaccine AS vaccine,

                DATE_FORMAT(
                    lt.ngay_tiem, '%Y-%m-%d'
                ) AS ngay_tiem,

                TIME_FORMAT(
                    lt.gio_tiem, '%H:%i'
                ) AS gio_tiem,

                lt.trang_thai,
                lt.co_so_id

            FROM lich_tiem lt

            LEFT JOIN vaccine v
                ON lt.vaccine_id = v.id

            WHERE lt.nguoi_dung_id = ?
              AND (
                  lt.ngay_tiem > CURDATE()
                  OR (
                      lt.ngay_tiem = CURDATE()
                      AND lt.gio_tiem >= CURTIME()
                  )
              )
              AND lt.trang_thai IN (
                  'CHO_DUYET',
                  'DA_DUYET'
              )

            ORDER BY
                lt.ngay_tiem ASC,
                lt.gio_tiem ASC,
                lt.id ASC

            LIMIT 1
            `,
            [userId]
        )
    ]);

    return {
        lichSapToi: toNumber(
            upcomingRows[0]?.total
        ),

        muiDaTiem: toNumber(
            injectedRows[0]?.total
        ),

        tongLichSuTiem: toNumber(
            historyRows[0]?.total
        ),

        thanhToanChoXuLy: toNumber(
            paymentRows[0]?.total
        ),

        lichTiemGanNhat: nearestRows[0] || null
    };
}

module.exports = {
    getAdminOverview,
    getStaffOverview,
    getCustomerOverview
};
