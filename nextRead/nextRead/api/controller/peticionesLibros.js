const getAllBooks = async (_req, res) => {
    try {
        const libros = await Libro.findAll();
        console.log("Libros encontrados:", libros.length);
        res.json(libros);
    } catch (error) {
        console.error("ERROR en getAllBooks:", error);
        return res.status(500).json({
            error: "Error al obtener libros",
            mensaje: error.message,
        });
    }
};

module.exports = {
    getAllBooks

}