import db from "../config/database.js";
import axios from "axios";

export async function renderHome(req, res) {
    const query = "SELECT * FROM notes WHERE user_id = $1 ORDER BY id ASC";
    const result = await db.query(query, [req.session.userId]);
    // console.log(result.rows);
    let errors = [];

    for (let i = 0; i < result.rows.length; i++) {
            // console.log(result.rows[i].book_isbn);
            let isbn = result.rows[i].book_isbn.trim();
            // Construct the URL
            const url = "https://openlibrary.org/api/books?bibkeys=ISBN:" + encodeURIComponent(isbn) + "&format=json&jscmd=data";

            try {
                const response = await axios.get(url);
                const data = response.data[`ISBN:${isbn}`];
                // console.log(data);
                if (data) {
                    var tags = data.subjects && data.subjects.length > 0 ? data.subjects[0].name : "No subjects available";

                    for(var k = 1; k < Math.min(data.subjects?.length || 0, 3); k++) {
                        tags += ", " + data.subjects[k].name;
                    }

                    result.rows[i].tags = tags;
                    result.rows[i].cover = data.cover ? data.cover.large : "./images.png";
                    result.rows[i].pages = data.number_of_pages || "not available";
                    result.rows[i].publish_date = data.publish_date || "not available";
                    result.rows[i].publishers = (data.publishers && data.publishers.length > 0) ? data.publishers[0].name : "not available";
                    result.rows[i].linkurl = data.url || "not available";
                } else {
                    errors.push({ isbn, error: "Book not found" });
                }

            } catch (error) {
                // console.error("Error fetching book data:", error);
                errors.push({ isbn, error: "Failed to fetch book data" });
            }
        }

    if (errors.length > 0) {
        return res.status(500).json({ errors });
    }

    res.render("home.ejs", {
        books: result.rows
    });
}

export function renderAddBook(req, res) {
    res.render("add.ejs");
}

export async function addBook(req, res) {
    try{
        const query = "INSERT INTO notes (user_id,book_isbn,book_notes_date,book_rating,book_title,author) VALUES ($1,$2,$3,$4,$5,$6)";
        await db.query(query, [req.session.userId, req.body.isbn, req.body.start_date, req.body.rating, req.body.title, req.body.author]);
        res.redirect("/");
    }
    catch(err){
        console.log(err,"error adding book");
        res.status(500).send("Error adding book");
    }
}
