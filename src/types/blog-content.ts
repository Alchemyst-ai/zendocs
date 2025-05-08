export interface BlogContent {
    id: string;
    title: string;
    image: string;
    authorImage?: string;
    authorName: string;
    blogCategory: string;
    dateOfBlog: string;
    readTime: string;
    redirectLink: string;
    content: string;
    keywords: string[];
}

export interface Blog {
    redirectLink: string;
    blogCategory: string;
    title: string;
    authorImage?: string;
    authorName: string;
    readTime: string;
    image?: string;
    content: string;
}