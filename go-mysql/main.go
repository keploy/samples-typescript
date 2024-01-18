package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

type Item struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func main() {
	db := initDB()
	defer db.Close()

	r := gin.Default()

	r.GET("/items", getItems(db))
	r.POST("/items", postItem(db))
	r.PUT("/items/:id", updateItem(db))
	r.DELETE("/items/:id", deleteItem(db))

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000" // default port if not specified
	}

	r.Run(":" + port)
}

func initDB() *sql.DB {
	host := os.Getenv("DATABASE_HOST")
	if host == "" {
		host = "localhost"
	}
	user := os.Getenv("DATABASE_USER")
	if user == "" {
		user = "user"
	}
	password := os.Getenv("DATABASE_PASSWORD")
	if password == "" {
		password = "password"
	}
	database := os.Getenv("DATABASE_NAME")
	if database == "" {
		database = "mydb"
	}

	dataSource := fmt.Sprintf("%s:%s@tcp(%s)/%s", user, password, host, database)
	db, err := sql.Open("mysql", dataSource)
	if err != nil {
		log.Fatal(err)
	}

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec("CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
	if err != nil {
		log.Fatal(err)
	}

	return db
}

func getItems(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var items []Item
		rows, err := db.Query("SELECT * FROM items")
		if err != nil {
			log.Fatal(err)
		}
		defer rows.Close()

		for rows.Next() {
			var i Item
			if err := rows.Scan(&i.ID, &i.Name, &i.Description); err != nil {
				log.Fatal(err)
			}
			items = append(items, i)
		}
		c.JSON(http.StatusOK, items)
	}
}

func postItem(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var newItem Item
		if err := c.BindJSON(&newItem); err != nil {
			return
		}

		result, err := db.Exec("INSERT INTO items (name, description) VALUES (?, ?)", newItem.Name, newItem.Description)
		if err != nil {
			log.Fatal(err)
		}

		id, err := result.LastInsertId()
		if err != nil {
			log.Fatal(err)
		}

		c.JSON(http.StatusCreated, gin.H{"id": id})
	}
}

func updateItem(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var updatedItem Item
		if err := c.BindJSON(&updatedItem); err != nil {
			return
		}

		_, err := db.Exec("UPDATE items SET name = ?, description = ? WHERE id = ?", updatedItem.Name, updatedItem.Description, id)
		if err != nil {
			log.Fatal(err)
		}

		c.JSON(http.StatusOK, gin.H{"message": "Item updated successfully."})
	}
}

func deleteItem(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		_, err := db.Exec("DELETE FROM items WHERE id = ?", id)
		if err != nil {
			log.Fatal(err)
		}

		c.JSON(http.StatusOK, gin.H{"message": "Item deleted successfully."})
	}
}
