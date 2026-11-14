const db = require("../config/db");
async function isDuplicateName(
    tenCoSo,
    excludeId = null
) {
    let sql = `
        SELECT id
        FROM co_so_tiem
        WHERE LOWER(TRIM(ten_co_so))
            = LOWER(TRIM(?))
    `;

    const params = [
        tenCoSo
    ];

    if (excludeId !== null) {
        sql += `
            AND id <> ?
        `;

        params.push(
            excludeId
        );
    }

    sql += `
        LIMIT 1
    `;

    const [rows] = await db.query(
        sql,
        params
    );

    return rows.length > 0;
}

async function getAll() {
    const [rows] = await db.query(`
        SELECT
            id,
            ten_co_so,
            dia_chi,
            so_dien_thoai,
            gio_mo,
            gio_dong,
            hinh_anh,
            mo_ta,
            ma_nhung_ban_do,
            trang_thai
        FROM co_so_tiem
        ORDER BY id ASC
    `);

    return rows;
}

async function getById(id) {
    const [rows] = await db.query(
        `
            SELECT
                id,
                ten_co_so,
                dia_chi,
                so_dien_thoai,
                gio_mo,
                gio_dong,
                hinh_anh,
                mo_ta,
                ma_nhung_ban_do,
                trang_thai
            FROM co_so_tiem
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    );

    return rows;
}

async function getExistingImage(id) {
    const [rows] = await db.query(
        `
            SELECT
                id,
                hinh_anh
            FROM co_so_tiem
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    );

    return rows;
}

async function getStatusById(id) {
    const [rows] = await db.query(
        `
            SELECT
                id,
                trang_thai
            FROM co_so_tiem
            WHERE id = ?
            LIMIT 1
        `,
        [id]
    );

    return rows;
}

async function create(data) {
    const {
        tenCoSo,
        diaChi,
        soDienThoai,
        gioMo,
        gioDong,
        imagePath,
        moTa,
        maNhungBanDo
    } = data;

    await db.query(
        `
            INSERT INTO co_so_tiem
            (
                ten_co_so,
                dia_chi,
                so_dien_thoai,
                gio_mo,
                gio_dong,
                hinh_anh,
                mo_ta,
                ma_nhung_ban_do,
                trang_thai
            )
            VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                'HOAT_DONG'
            )
        `,
        [
            tenCoSo,
            diaChi,
            soDienThoai,
            gioMo,
            gioDong,
            imagePath,
            moTa || null,
            maNhungBanDo
        ]
    );
}

async function update(id, data) {
    const {
        tenCoSo,
        diaChi,
        soDienThoai,
        gioMo,
        gioDong,
        imagePath,
        moTa,
        maNhungBanDo
    } = data;

    await db.query(
        `
            UPDATE co_so_tiem
            SET
                ten_co_so = ?,
                dia_chi = ?,
                so_dien_thoai = ?,
                gio_mo = ?,
                gio_dong = ?,
                hinh_anh = ?,
                mo_ta = ?,
                ma_nhung_ban_do = ?
            WHERE id = ?
        `,
        [
            tenCoSo,
            diaChi,
            soDienThoai,
            gioMo,
            gioDong,
            imagePath,
            moTa || null,
            maNhungBanDo,
            id
        ]
    );
}

async function stop(id) {
    await db.query(
        `
            UPDATE co_so_tiem
            SET trang_thai = 'TAM_DUNG'
            WHERE id = ?
        `,
        [id]
    );
}

async function activate(id) {
    await db.query(
        `
            UPDATE co_so_tiem
            SET trang_thai = 'HOAT_DONG'
            WHERE id = ?
        `,
        [id]
    );
}

module.exports = {
    isDuplicateName,
    getAll,
    getById,
    getExistingImage,
    getStatusById,
    create,
    update,
    stop,
    activate
};
