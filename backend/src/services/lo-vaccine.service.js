
const db = require("../config/db");
async function syncLotStatuses(connection) {
    await connection.query(
        `
            UPDATE lo_vaccine
            SET trang_thai = 'HET_HAN'
            WHERE trang_thai = 'DANG_SU_DUNG'
              AND han_su_dung < CURDATE()
        `
    );
    await connection.query(
        `
            UPDATE lo_vaccine
            SET trang_thai = 'HET_HANG'
            WHERE trang_thai = 'DANG_SU_DUNG'
              AND so_luong_con <= 0
              AND han_su_dung >= CURDATE()
        `
    );
}

async function syncVaccineStatus(connection, vaccineId) {
    const [vaccineRows] = await connection.query(
        `
            SELECT id, trang_thai
            FROM vaccine
            WHERE id = ?
            LIMIT 1
        `,
        [vaccineId]
    );

    if (vaccineRows.length === 0) {
        return;
    }

    const vaccine = vaccineRows[0];

    // Không tự kích hoạt vaccine đã NGUNG
    if (vaccine.trang_thai === "NGUNG") {
        return;
    }
    const [usableRows] = await connection.query(
        `
            SELECT id
            FROM lo_vaccine
            WHERE vaccine_id = ?
              AND trang_thai = 'DANG_SU_DUNG'
              AND so_luong_con > 0
              AND han_su_dung >= CURDATE()
            LIMIT 1
        `,
        [vaccineId]
    );

    const newStatus =
        usableRows.length > 0
            ? "CON"
            : "HET";

    // Chỉ cập nhật nếu trạng thái thay đổi
    if (vaccine.trang_thai !== newStatus) {
        await connection.query(
            `
                UPDATE vaccine
                SET trang_thai = ?
                WHERE id = ?
                  AND trang_thai <> 'NGUNG'
            `,
            [newStatus, vaccineId]
        );
    }
}

async function getLots(vaccineId, coSoId) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        await syncLotStatuses(connection);
        if (vaccineId) {
            await syncVaccineStatus(
                connection,
                Number(vaccineId)
            );
        } else {
            const [vaccineRows] = await connection.query(
                `
                    SELECT DISTINCT vaccine_id
                    FROM lo_vaccine
                `
            );

            for (const row of vaccineRows) {
                await syncVaccineStatus(
                    connection,
                    row.vaccine_id
                );
            }
        }
        // TRUY VẤN DANH SÁCH LÔ
        let sql = `
            SELECT
                lv.id,
                lv.vaccine_id,
                lv.co_so_id,
                v.ten_vaccine,
                v.phong_benh,
                cs.ten_co_so,
                lv.ma_lo,
                lv.so_luong_nhap,
                lv.so_luong_con,
                lv.han_su_dung,
                lv.ngay_nhap,
                lv.trang_thai
            FROM lo_vaccine lv
            INNER JOIN vaccine v
                ON v.id = lv.vaccine_id
            INNER JOIN co_so_tiem cs
                ON cs.id = lv.co_so_id
        `;

        const conditions = [];
        const params = [];

        // Lọc theo vaccine
        if (vaccineId) {
            conditions.push("lv.vaccine_id = ?");
            params.push(Number(vaccineId));
        }

        // Lọc theo cơ sở tiêm
        if (coSoId) {
            conditions.push("lv.co_so_id = ?");
            params.push(Number(coSoId));
        }

        if (conditions.length > 0) {
            sql += `
                WHERE ${conditions.join(" AND ")}
            `;
        }

        sql += `
            ORDER BY lv.ngay_nhap DESC, lv.id DESC
        `;

        const [rows] = await connection.query(
            sql,
            params
        );

        await connection.commit();

        return rows;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}
async function createLot(data) {
    const {
        vaccine_id,
        co_so_id,
        ma_lo,
        so_luong_nhap,
        han_su_dung
    } = data;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        // KIỂM TRA VACCINE
        const [vaccineRows] = await connection.query(
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
            [Number(vaccine_id)]
        );

        if (vaccineRows.length === 0) {
            await connection.rollback();

            return {
                status: "VACCINE_NOT_FOUND"
            };
        }

        const vaccine = vaccineRows[0];

        if (vaccine.trang_thai === "NGUNG") {
            await connection.rollback();

            return {
                status: "VACCINE_STOPPED"
            };
        }

        // KIỂM TRA CƠ SỞ TIÊM
        const [coSoRows] = await connection.query(
            `
                SELECT
                    id,
                    ten_co_so,
                    trang_thai
                FROM co_so_tiem
                WHERE id = ?
                LIMIT 1
                FOR UPDATE
            `,
            [Number(co_so_id)]
        );

        if (coSoRows.length === 0) {
            await connection.rollback();

            return {
                status: "FACILITY_NOT_FOUND"
            };
        }

        const coSo = coSoRows[0];

        if (coSo.trang_thai !== "HOAT_DONG") {
            await connection.rollback();

            return {
                status: "FACILITY_INACTIVE"
            };
        }
        // KIỂM TRA TRÙNG MÃ LÔ
        const [duplicateRows] = await connection.query(
            `
                SELECT id
                FROM lo_vaccine
                WHERE vaccine_id = ?
                  AND LOWER(TRIM(ma_lo)) = LOWER(?)
                LIMIT 1
            `,
            [
                Number(vaccine_id),
                ma_lo
            ]
        );

        if (duplicateRows.length > 0) {
            await connection.rollback();

            return {
                status: "DUPLICATE"
            };
        }
        // THÊM LÔ VACCINE
        const quantity = Number(so_luong_nhap);

        const [insertResult] = await connection.query(
            `
                INSERT INTO lo_vaccine (
                    vaccine_id,
                    co_so_id,
                    ma_lo,
                    so_luong_nhap,
                    so_luong_con,
                    han_su_dung,
                    ngay_nhap,
                    trang_thai
                )
                VALUES (
                    ?, ?, ?, ?, ?, ?, NOW(), 'DANG_SU_DUNG'
                )
            `,
            [
                Number(vaccine_id),
                Number(co_so_id),
                ma_lo,
                quantity,
                quantity,
                han_su_dung
            ]
        );

        // GHI LỊCH SỬ NHẬP KHO VACCINE
        await connection.query(
            `
                INSERT INTO lich_su_bien_dong_kho (
                    lo_vaccine_id,
                    loai_bien_dong,
                    so_luong,
                    thoi_gian,
                    tham_chieu,
                    ghi_chu
                )
                VALUES (?, 'NHAP', ?, NOW(), ?, ?)
            `,
            [
                insertResult.insertId,
                quantity,
                `LO_VACCINE:${insertResult.insertId}`,
                "Nhập lô vaccine mới"
            ]
        );

        await syncVaccineStatus(
            connection,
            Number(vaccine_id)
        );
        // LẤY THÔNG TIN LÔ VỪA THÊM
        const [newRows] = await connection.query(
            `
                SELECT
                    lv.id,
                    lv.vaccine_id,
                    lv.co_so_id,
                    v.ten_vaccine,
                    v.phong_benh,
                    cs.ten_co_so,
                    lv.ma_lo,
                    lv.so_luong_nhap,
                    lv.so_luong_con,
                    lv.han_su_dung,
                    lv.ngay_nhap,
                    lv.trang_thai
                FROM lo_vaccine lv
                INNER JOIN vaccine v
                    ON v.id = lv.vaccine_id
                INNER JOIN co_so_tiem cs
                    ON cs.id = lv.co_so_id
                WHERE lv.id = ?
                LIMIT 1
            `,
            [insertResult.insertId]
        );

        await connection.commit();

        return {
            status: "SUCCESS",
            data: newRows[0]
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

async function stopLot(id) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        await syncLotStatuses(connection);
        // KIỂM TRA LÔ VACCINE
        const [lotRows] = await connection.query(
            `
                SELECT
                    id,
                    vaccine_id,
                    co_so_id,
                    ma_lo,
                    so_luong_con,
                    han_su_dung,
                    trang_thai
                FROM lo_vaccine
                WHERE id = ?
                LIMIT 1
                FOR UPDATE
            `,
            [Number(id)]
        );

        if (lotRows.length === 0) {
            await connection.rollback();

            return {
                status: "NOT_FOUND"
            };
        }

        const lot = lotRows[0];
        // KIỂM TRA TRẠNG THÁI LÔ
        if (lot.trang_thai !== "DANG_SU_DUNG") {
            await connection.rollback();

            if (lot.trang_thai === "NGUNG") {
                return {
                    status: "ALREADY_STOPPED"
                };
            }

            if (lot.trang_thai === "HET_HANG") {
                return {
                    status: "OUT_OF_STOCK"
                };
            }

            if (lot.trang_thai === "HET_HAN") {
                return {
                    status: "EXPIRED"
                };
            }

            return {
                status: "INVALID_STATUS"
            };
        }
        // NGỪNG SỬ DỤNG LÔ
        await connection.query(
            `
                UPDATE lo_vaccine
                SET trang_thai = 'NGUNG'
                WHERE id = ?
                  AND trang_thai = 'DANG_SU_DUNG'
            `,
            [Number(id)]
        );

        await syncVaccineStatus(
            connection,
            lot.vaccine_id
        );

        await connection.commit();

        return {
            status: "SUCCESS"
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

module.exports = {
    syncLotStatuses,
    syncVaccineStatus,
    getLots,
    createLot,
    stopLot
};
