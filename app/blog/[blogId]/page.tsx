import axios from "axios";


export default async function BlogComponent({params} : any){

    const BlogId = (await params).blogId;

    const response = await axios.get(`https://jsonplaceholder.typicode.com/todos/${BlogId}`)


      const data = response.data;

      return <div>

        Hello {BlogId}

        <br/>

     <p> Title -- {data.title}</p>
     <p> done -- {data.completed ? "Done " : "Not Done "}</p>

          
      </div>
}