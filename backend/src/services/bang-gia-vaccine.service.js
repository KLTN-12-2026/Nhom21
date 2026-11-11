const db = require("../config/db");

// MỖI VACCINE LẤY BẢN GHI GIÁ MỚI NHẤT
// VACCINE NGUNG VẪN HIỂN THỊ
async function getAll() {
    const [rows] = await db.query(`
        SELECT
            bg.id,
            bg.vaccine_id,
            v.ten_vaccine,
            v.phong_benh,
            v.nuoc_sx,
            v.trang_thai AS trang_thai_vaccine,
            bg.gia_ban,
            bg.gia_uu_dai,
            bg.trang_thai,
            bg.ngay_bat_dau,
            bg.ngay_ket_thuc,
            bg.ngay_tao
        FROM bang_gia_vaccine bg
        JOIN vaccine v
            ON v.id = bg.vaccine_id
        WHERE bg.id = (
            SELECT bg2.id
            FROM bang_gia_vaccine bg2
            WHERE bg2.vaccine_id = bg.vaccine_id
            ORDER BY
                bg2.ngay_bat_dau DESC,
                bg2.id DESC
            LIMIT 1
        )
        ORDER BY bg.id DESC
    `);

    return rows;
}

// KIỂM TRA VACCINE TỒN TẠI
// DÙNG CHO XEM LỊCH SỬ GIÁ
async function getVaccineById(vaccineId) {
    const [rows] = await db.query(
        `
            SELECT
                id,
                ten_vaccine,
                trang_thai
            FROM vaccine
            WHERE id = ?
            LIMIT 1
        `,
        [vaccineId]
    );

    return rows;
}

// LẤY TOÀN BỘ LỊCH SỬ GIÁ
async function getHistory(vaccineId) {
    const [rows] = await db.query(
        `
            SELECT
                bg.id,
                bg.vaccine_id,
                v.ten_vaccine,
                v.trang_thai AS trang_thai_vaccine,
                bg.gia_ban,
                bg.gia_uu_dai,
                bg.trang_thai,
                bg.ngay_bat_dau,
                bg.ngay_ket_thuc,
                bg.ngay_tao
            FROM bang_gia_vaccine bg
            JOIN vaccine v
                ON v.id = bg.vaccine_id
            WHERE bg.vaccine_id = ?
            ORDER BY
                bg.ngay_bat_dau DESC,
                bg.id DESC
        `,
        [vaccineId]
    );

    return rows;
}

// THÊM BẢNG GIÁ MỚI
async function create(data) {
    let connection;

    try {
        const {
            vaccine_id,
            gia_ban,
            gia_uu_dai
        } = data;

        connection = await db.getConnection();

        await connection.beginTransaction();

        // KIỂM TRA VACCINE
        const [checkVaccine] =
            await connection.query(
                `
                    SELECT
                        id,
                        ten_vaccine,
                        trang_thai
                    FROM vaccine
                    WHERE id = ?
                    LIMIT 1
                    FOR UPDATE
                `,
                [vaccine_id]
            );

        if (checkVaccine.length === 0) {
            await connection.rollback();

            return {
                ok: false,
                status: 404,
                message: "Vaccine không tồn tại"
            };
        }

        // VACCINE NGUNG KHÔNG ĐƯỢC THÊM GIÁ
        if (
            checkVaccine[0].trang_thai === "NGUNG"
        ) {
            await connection.rollback();

            return {
                ok: false,
                status: 400,
                message:
                    "Vaccine này đã ngừng sử dụng. Vui lòng kích hoạt lại vaccine trước khi thêm giá."
            };
        }

        // KIỂM TRA GIÁ ĐANG ÁP DỤNG
        const [checkActivePrice] =
            await connection.query(
                `
                    SELECT id
                    FROM bang_gia_vaccine
                    WHERE vaccine_id = ?
                        AND trang_thai = 'DANG_AP_DUNG'
                    LIMIT 1
                    FOR UPDATE
                `,
                [vaccine_id]
            );

        if (checkActivePrice.length > 0) {
            await connection.rollback();

            return {
                ok: false,
                status: 409,
                message:
                    "Vaccine này đang có giá áp dụng. Hãy sử dụng chức năng Đổi giá."
            };
        }

        // THÊM BẢNG GIÁ MỚI
        const [result] =
            await connection.query(
                `
                    INSERT INTO bang_gia_vaccine (
                        vaccine_id,
                        gia_ban,
                        gia_uu_dai,
                        trang_thai,
                        ngay_bat_dau,
                        ngay_ket_thuc
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        'DANG_AP_DUNG',
                        NOW(),
                        NULL
                    )
                `,
                [
                    vaccine_id,
                    gia_ban,
                    gia_uu_dai
                ]
            );

        await connection.commit();

        return {
            ok: true,
            id: result.insertId
        };

    } catch (err) {

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackErr) {
                console.error(
                    "LỖI ROLLBACK THÊM GIÁ:",
                    rollbackErr
                );
            }
        }

        throw err;

    } finally {

        if (connection) {
            connection.release();
        }
    }
}


// ĐỔI GIÁ VACCINE
// GIÁ CŨ -> HET_HIEU_LUC
// GIÁ MỚI -> DANG_AP_DUNG
async function update(id, data) {
    let connection;

    try {
        const {
            vaccine_id,
            gia_ban,
            gia_uu_dai
        } = data;

        connection = await db.getConnection();

        await connection.beginTransaction();

        // LẤY BẢNG GIÁ ĐƯỢC CHỌN
        const [checkPrice] =
            await connection.query(
                `
                    SELECT
                        id,
                        vaccine_id,
                        gia_ban,
                        gia_uu_dai,
                        trang_thai
                    FROM bang_gia_vaccine
                    WHERE id = ?
                    LIMIT 1
                    FOR UPDATE
                `,
                [id]
            );

        if (checkPrice.length === 0) {
            await connection.rollback();

            return {
                ok: false,
                status: 404,
                message: "Không tìm thấy bảng giá"
            };
        }

        const selectedPrice = checkPrice[0];

        // KHÔNG ĐƯỢC THAY ĐỔI VACCINE CỦA BẢNG GIÁ
        if (
            Number(selectedPrice.vaccine_id) !==
            vaccine_id
        ) {
            await connection.rollback();

            return {
                ok: false,
                status: 400,
                message:
                    "Không được thay đổi vaccine của bảng giá"
            };
        }

        // KIỂM TRA VACCINE
        const [checkVaccine] =
            await connection.query(
                `
                    SELECT
                        id,
                        ten_vaccine,
                        trang_thai
                    FROM vaccine
                    WHERE id = ?
                    LIMIT 1
                    FOR UPDATE
                `,
                [vaccine_id]
            );

        if (checkVaccine.length === 0) {
            await connection.rollback();

            return {
                ok: false,
                status: 404,
                message: "Vaccine không tồn tại"
            };
        }
        // CHẶN VACCINE NGUNG
        if (
            checkVaccine[0].trang_thai === "NGUNG"
        ) {
            await connection.rollback();

            return {
                ok: false,
                status: 400,
                message:
                    "Vaccine này đã ngừng sử dụng. Vui lòng kích hoạt lại vaccine trước khi đổi giá."
            };
        }

        // TÌM GIÁ ĐANG ÁP DỤNG THỰC SỰ
        const [activePrices] =
            await connection.query(
                `
                    SELECT
                        id,
                        vaccine_id,
                        gia_ban,
                        gia_uu_dai,
                        trang_thai
                    FROM bang_gia_vaccine
                    WHERE vaccine_id = ?
                        AND trang_thai = 'DANG_AP_DUNG'
                    ORDER BY id DESC
                    LIMIT 1
                    FOR UPDATE
                `,
                [vaccine_id]
            );

        // NẾU ĐÃ CÓ GIÁ ĐANG ÁP DỤNG
        if (activePrices.length > 0) {
            const activePrice = activePrices[0];

            const currentPromo =
                activePrice.gia_uu_dai === null
                    ? null
                    : Number(
                        activePrice.gia_uu_dai
                    );

            // Không cho đổi nếu giá không thay đổi
            if (
                Number(activePrice.gia_ban) ===
                gia_ban &&
                currentPromo === gia_uu_dai
            ) {
                await connection.rollback();

                return {
                    ok: false,
                    status: 400,
                    message:
                        "Giá mới không có thay đổi so với giá hiện tại"
                };
            }

            // KẾT THÚC GIÁ ĐANG ÁP DỤNG
            await connection.query(
                `
                    UPDATE bang_gia_vaccine
                    SET
                        trang_thai = 'HET_HIEU_LUC',
                        ngay_ket_thuc = NOW()
                    WHERE id = ?
                        AND trang_thai = 'DANG_AP_DUNG'
                `,
                [activePrice.id]
            );
        }
        // TẠO BẢNG GIÁ MỚI
        // ÁP DỤNG CẢ TRƯỜNG HỢP KHÔNG CÓ
        // GIÁ DANG_AP_DUNG HIỆN TẠI
        const [result] =
            await connection.query(
                `
                    INSERT INTO bang_gia_vaccine (
                        vaccine_id,
                        gia_ban,
                        gia_uu_dai,
                        trang_thai,
                        ngay_bat_dau,
                        ngay_ket_thuc
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        'DANG_AP_DUNG',
                        NOW(),
                        NULL
                    )
                `,
                [
                    vaccine_id,
                    gia_ban,
                    gia_uu_dai
                ]
            );

        await connection.commit();

        return {
            ok: true,
            id: result.insertId
        };

    } catch (err) {

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackErr) {
                console.error(
                    "LỖI ROLLBACK ĐỔI GIÁ:",
                    rollbackErr
                );
            }
        }

        throw err;

    } finally {

        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    getAll,
    getVaccineById,
    getHistory,
    create,
    update
};
