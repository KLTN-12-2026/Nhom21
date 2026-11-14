const db = require("../config/db");
async function getReviewsByCoSo(coSoId) {
    const [reviews] = await db.query(
        `
        SELECT
            dg.id,
            dg.co_so_id,
            dg.nguoi_dung_id AS user_id,
            dg.so_sao,
            dg.nhan_xet,
            DATE_FORMAT(
                dg.ngay_tao,
                '%Y-%m-%d %H:%i:%s'
            ) AS created_at,
            COALESCE(
                NULLIF(tt.ho_ten, ''),
                u.ten_dang_nhap
            ) AS ten_nguoi_dung
        FROM danh_gia_co_so dg
        LEFT JOIN nguoi_dung u
            ON dg.nguoi_dung_id = u.id
        LEFT JOIN thong_tin_ca_nhan tt
            ON dg.nguoi_dung_id = tt.nguoi_dung_id
        WHERE dg.co_so_id = ?
        ORDER BY dg.ngay_tao DESC, dg.id DESC
        `,
        [coSoId]
    );

    return reviews;
}

async function getReviewSummary(coSoId) {
    const [rows] = await db.query(
        `
        SELECT
            COUNT(*) AS tong_danh_gia,
            ROUND(AVG(so_sao), 1) AS diem_trung_binh
        FROM danh_gia_co_so
        WHERE co_so_id = ?
        `,
        [coSoId]
    );

    return {
        tong_danh_gia: Number(
            rows[0]?.tong_danh_gia || 0
        ),
        diem_trung_binh: Number(
            rows[0]?.diem_trung_binh || 0
        )
    };
}

async function getUserById(userId) {
    const [users] = await db.query(
        `
        SELECT id, vai_tro
        FROM nguoi_dung
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
    );

    return users[0] || null;
}

async function hasVaccinatedAtCoSo(userId, coSoId) {
    const [rows] = await db.query(
        `
        SELECT id
        FROM lich_tiem
        WHERE nguoi_dung_id = ?
          AND co_so_id = ?
          AND trang_thai = 'DA_TIEM'
        LIMIT 1
        `,
        [userId, coSoId]
    );

    return rows.length > 0;
}

async function getExistingReview(coSoId, userId) {
    const [rows] = await db.query(
        `
        SELECT id
        FROM danh_gia_co_so
        WHERE co_so_id = ?
          AND nguoi_dung_id = ?
        LIMIT 1
        `,
        [coSoId, userId]
    );

    return rows[0] || null;
}

async function updateReview(
    coSoId,
    userId,
    soSao,
    nhanXet
) {
    await db.query(
        `
        UPDATE danh_gia_co_so
        SET
            so_sao = ?,
            nhan_xet = ?,
            ngay_cap_nhat = NOW()
        WHERE co_so_id = ?
          AND nguoi_dung_id = ?
        `,
        [
            soSao,
            nhanXet,
            coSoId,
            userId
        ]
    );
}

async function createReview(
    coSoId,
    userId,
    soSao,
    nhanXet
) {
    await db.query(
        `
        INSERT INTO danh_gia_co_so
            (
                co_so_id,
                nguoi_dung_id,
                so_sao,
                nhan_xet,
                ngay_tao,
                ngay_cap_nhat
            )
        VALUES (?, ?, ?, ?, NOW(), NOW())
        `,
        [
            coSoId,
            userId,
            soSao,
            nhanXet
        ]
    );
}

module.exports = {
    getReviewsByCoSo,
    getReviewSummary,
    getUserById,
    hasVaccinatedAtCoSo,
    getExistingReview,
    updateReview,
    createReview
};