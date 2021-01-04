package main

import (
	"fmt"
	"time"
)

func main() {

	count("sheep")
	count("fish")
}

func count(value string) {
	for i := 1; true; i++ {
		fmt.Println(i, value)
		time.Sleep(time.Millisecond * 500)
	}
}
